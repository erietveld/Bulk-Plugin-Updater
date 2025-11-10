// src/components/debug/CDNResourceDebugger.tsx
// CDN resource debugger component - UI RENDERING ONLY
// Following atomic design principle: React Components handle UI rendering only

import React, { useEffect } from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import { usePerformanceTracking } from '../../hooks/usePerformanceTracking';
import { useNotifications } from '../../hooks/useNotifications';
import { debugService } from '../../services/debugService';
import { logger, createLogContext } from '../../monitoring/logger';

export const CDNResourceDebugger: React.FC = () => {
  // Business logic from custom hooks
  const { incrementUserInteraction } = usePerformanceTracking();
  const { showInfo, showSuccess } = useNotifications();

  useEffect(() => {
    if (debugService.isDebugMode()) {
      incrementUserInteraction('debugModeActivations');
      
      // Show all external resources loaded from CDNs
      const cdnResources = Array.from(document.querySelectorAll('link[rel="stylesheet"], script[src]'))
        .filter(resource => {
          const url = (resource as HTMLLinkElement).href || (resource as HTMLScriptElement).src || '';
          return url.includes('cdn.') || 
                 url.includes('unpkg.') ||
                 url.includes('jsdelivr.');
        });

      if (cdnResources.length > 0) {
        // Log CDN resources to console via logger system
        const resourceDetails = cdnResources.map((resource, i) => {
          const url = (resource as HTMLLinkElement).href || (resource as HTMLScriptElement).src || '';
          return {
            index: i + 1,
            url,
            type: resource.tagName,
            element: resource
          };
        });

        logger.warn('🚨 CDN RESOURCES DETECTED - VALIDATION RECOMMENDED', createLogContext({
          cdnResourceCount: cdnResources.length,
          resources: resourceDetails,
          debugMode: true,
          validationNote: 'Click each URL in the console to validate resources load correctly'
        }));

        // Log each resource individually for easy clicking
        resourceDetails.forEach((resource) => {
          logger.info(`CDN Resource ${resource.index}: ${resource.url}`, createLogContext({
            resourceType: resource.type,
            resourceUrl: resource.url,
            clickToValidate: true
          }));
        });

        // Show brief, non-intrusive notification via hook
        showInfo({
          title: '🔍 CDN Debug Mode Active',
          message: `${cdnResources.length} CDN resources detected. Check console for validation URLs.`,
          icon: <IconExternalLink size={16} />,
          autoClose: 5000,
        });
      } else {
        logger.info('CDN Debug Mode: No CDN resources detected', createLogContext({
          debugMode: true,
          cdnResourceCount: 0
        }));

        showSuccess({
          title: '✅ CDN Debug Complete',
          message: 'No external CDN resources detected.',
          autoClose: 3000,
        });
      }
    }
  }, [incrementUserInteraction, showInfo, showSuccess]);

  return null; // Debug component doesn't render UI
};