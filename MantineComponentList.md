# Mantine UI Components and Theming Resources (2025) for React 19

## Official Mantine UI Component Catalog

### Basic UI Elements

- **Button**
  - Usage: `<Button onClick={handleClick} variant="filled" color="blue">Click me</Button>`
  - Key props: `variant` (filled, outline, light), `color`, `loading`
  
- **Input**
  - Usage: `<Input placeholder="Enter text" value={value} onChange={setValue} />`
  - Key props: `placeholder`, `value`, `onChange`, `error`

- **Select**
  - Usage: `<Select data={['React', 'Vue']} label="Choose framework" />`
  - Key props: `data` (array), `label`, `searchable`, `placeholder`

- **Checkbox**
  - Usage: `<Checkbox label="Accept terms" checked={checked} onChange={toggle} />`
  - Key props: `checked`, `onChange`, `label`

- **Radio**
  - Usage: `<RadioGroup value={value} onChange={setValue}><Radio value="1" label="Option 1" /></RadioGroup>`
  - Key props: `value`, `onChange`, `name`

- **Switch**
  - Usage: `<Switch checked={checked} onChange={toggle} label="Enable feature" />`
  - Key props: `checked`, `onChange`, `label`

- **Textarea**
  - Usage: `<Textarea placeholder="Add detailed description" />`
  - Key props: `placeholder`, `value`, `onChange`, `minRows`

- **Text**
  - Usage: `<Text size="lg" weight={500}>Hello, Mantine!</Text>`
  - Key props: `size`, `weight`, `color`

- **Anchor**
  - Usage: `<Anchor href="https://mantine.dev" target="_blank">Visit Mantine</Anchor>`
  - Key props: `href`, `target`, `color`

- **Badge**
  - Usage: `<Badge color="green">New</Badge>`
  - Key props: `color`, `variant`

---

### Layout & Navigation

- **Container**
  - Usage: `<Container size="md">Content</Container>`
  - Key props: `size` (sm, md, lg, xl), `padding`

- **Grid**
  - Usage: `<Grid><Col span={6}>Left</Col><Col span={6}>Right</Col></Grid>`
  - Key props: `columns`, `gutter`, `justify`

- **Group**
  - Usage: `<Group spacing="md"><Button>A</Button><Button>B</Button></Group>`
  - Key props: `spacing`, `position`, `grow`

- **Stack**
  - Usage: `<Stack spacing="sm"><Text>Line1</Text><Text>Line2</Text></Stack>`
  - Key props: `spacing`, `align`

- **Navbar**
  - Usage: `<Navbar><Navbar.Section>Links</Navbar.Section></Navbar>`
  - Key props: `width`, `height`, `fixed`

- **Header**
  - Usage: `<Header height={60}><Text>Header</Text></Header>`
  - Key props: `height`, `padding`

- **Footer**
  - Usage: `<Footer height={40}><Text>Footer</Text></Footer>`
  - Key props: `height`, `padding`

- **Burger**
  - Usage: `<Burger opened={opened} onClick={toggle} />`
  - Key props: `opened`, `onClick`

- **Pagination**
  - Usage: `<Pagination total={10} page={page} onChange={setPage} />`
  - Key props: `total`, `page`, `onChange`

- **Tabs**
  - Usage: `<Tabs defaultValue="first"><Tabs.List><Tabs.Tab value="first">First</Tabs.Tab></Tabs.List><Tabs.Panel value="first">Content</Tabs.Panel></Tabs>`
  - Key props: `value`, `defaultValue`, `onTabChange`

- **Drawer**
  - Usage: `<Drawer opened={opened} onClose={close}><Text>Menu</Text></Drawer>`
  - Key props: `opened`, `onClose`, `position`

---

### Data Display & Interaction

- **Table**
  - Usage: `<Table><thead>...</thead><tbody>...</tbody></Table>`
  - Key props: standard HTML table props; supports column sorting/pagination via extensions

- **Card**
  - Usage: `<Card shadow="sm" padding="lg"><Text>Card content</Text></Card>`
  - Key props: `shadow`, `padding`, `radius`

- **Tooltip**
  - Usage: `<Tooltip label="Info"><Button>Hover me</Button></Tooltip>`
  - Key props: `label`, `position`

- **Modal**
  - Usage: `<Modal opened={opened} onClose={close}><Text>Modal content</Text></Modal>`
  - Key props: `opened`, `onClose`, `title`

- **Popover**
  - Usage: `<Popover position="bottom" opened={open}><Popover.Target><Button>Open</Button></Popover.Target><Popover.Dropdown>Info</Popover.Dropdown></Popover>`
  - Key props: `position`, `opened`

- **Collapse**
  - Usage: `<Collapse in={open}><Text>Collapsed content</Text></Collapse>`
  - Key props: `in`, `transitionDuration`

- **Accordion**
  - Usage: `<Accordion><Accordion.Item label="Label">Content</Accordion.Item></Accordion>`
  - Key props: `multiple`, `value`

- **Avatar**
  - Usage: `<Avatar src="/img.jpg" alt="User" />`
  - Key props: `src`, `alt`, `radius`

- **Notification**
  - Usage: `showNotification({ title: 'Success', message: 'Data saved', color: 'green' })`
  - Key props: `title`, `message`, `color`

---

### Forms

- **TextInput**
  - Usage: `<TextInput label="Name" placeholder="Your name" />`
  - Key props: `label`, `placeholder`, `value`, `onChange`

- **PasswordInput**
  - Usage: `<PasswordInput label="Password" placeholder="Enter password" />`
  - Key props: same as TextInput; auto-hide/show password toggle built-in

- **Checkbox**
  - Usage: `<Checkbox label="Subscribe" checked={checked} onChange={toggle} />`
  - Key props: `label`, `checked`, `onChange`

- **RadioGroup**
  - Usage: `<RadioGroup label="Choose" value={value} onChange={setValue}><Radio value="a" label="A"/></RadioGroup>`
  - Key props: `label`, `value`, `onChange`

- **Select**
  - Usage: `<Select label="Pick one" data={['A','B']} />`
  - Key props: `label`, `data`, `searchable`

- **MultiSelect**
  - Usage: `<MultiSelect label="Pick multiple" data={['A','B']} />`
  - Key props: `label`, `data`

- **Slider**
  - Usage: `<Slider label="Volume" min={0} max={100} />`
  - Key props: `label`, `min`, `max`, `step`

- **Switch**
  - Usage: `<Switch label="Enable" checked={checked} onChange={toggle} />`
  - Key props: `label`, `checked`, `onChange`

---

### Advanced & Specialized Components

- **Carousel**
  - Usage: `<Carousel><Carousel.Slide><Image /></Carousel.Slide></Carousel>`
  - Key props: `slideSize`, `slideGap`, `loop`

- **Calendar**
  - Usage: `<Calendar value={date} onChange={setDate} />`
  - Key props: `value`, `onChange`, `locale`

- **DatePicker**
  - Usage: `<DatePicker placeholder="Pick date" value={date} onChange={setDate} />`
  - Key props: `value`, `onChange`, `placeholder`

- **TimeInput**
  - Usage: `<TimeInput value={time} onChange={setTime} />`
  - Key props: `value`, `onChange`

- **ColorPicker**
  - Usage: `<ColorPicker format="hex" value={color} onChange={setColor} />`
  - Key props: `format`, `value`, `onChange`

- **Progress**
  - Usage: `<Progress value={60} />`
  - Key props: `value`, `size`, `color`

- **SegmentedControl**
  - Usage: `<SegmentedControl data={[{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]} value={value} onChange={setValue} />`
  - Key props: `data`, `value`, `onChange`

- **Timeline**
  - Usage: `<Timeline active={1}><Timeline.Item>Step 1</Timeline.Item></Timeline>`
  - Key props: `active`, `bulletSize`

---

## Theming and MantineProvider

- **MantineProvider**
  - Wrap your app: `<MantineProvider theme={themeObject} withGlobalStyles withNormalizeCSS>...</MantineProvider>`
  - Provides global theming and styling context.

- **Theme Object**
  - Customize colors, fonts, spacing, shadows, radius, etc.
  - Example:
    ```
    const theme = {
      colors: { brand: ['#E3F9E5', '#C1EAC5', '#A3D9A5'] },
      primaryColor: 'brand',
      fontFamily: 'Arial, sans-serif',
      radius: { xs: 4, sm: 6, md: 8 },
    };
    ```

- **Theme Switching**
  - Use `const { colorScheme, toggleColorScheme } = useMantineColorScheme();`
  - Toggle via button or system preference.

---

## Curated Ecosystem: Awesome Mantine (GitHub)

- Extends core Mantine with community components:
  - Advanced data grids, schedulers, onboarding tours.
  - Animation wrappers and utilities.
  - Custom hooks for theme/app state.
- Usage:
  - Install via npm
  - Import and use components as normal Mantine components.