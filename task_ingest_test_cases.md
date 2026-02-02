# Demo Project
## Phase A

### Implement parser
  Accept only ### headings as steps.
  Indented lines become details.

### Update docs
  Mention the format in README.

# Markdown Rendering (Details)
## Notes
- Only `###` headings become tasks.
- Details lines must be indented.
- In details, DO NOT use `###` headings (use `####` or deeper).

## Rich Markdown in details

## Expected (visual)
- Details panel (Split) and active task body (Inline) should render:
  - Bulleted + numbered lists with proper indentation
  - Inline code with a subtle pill background
  - Fenced code blocks in a dark box with horizontal scroll
  - Links in accent color, underlined on hover
  - `####` headings as slightly bolder text
- Sanitization check:
  - No alerts/popups should ever run
  - The `javascript:` link should not be clickable/should have its href removed
  - The `<script>` tag should not appear as executable content

### Render lists + inline code
  Here is a list:
  - item one
  - item two with `inline code`
  - item three
  
  And an ordered list:
  1. first
  2. second

### Render code blocks
  ```js
  function hello(name) {
    return `hi ${name}`;
  }
  ```
  
  Inline: `const x = 1`.

### Render links + emphasis
  Visit [OpenAI](https://openai.com).
  
  **Bold**, *italic*, and ~~strike~~.

### Render headings inside details (use ####)
  #### Subsection
  Some text under a subsection.
  
  #### Another subsection
  - bullet under subsection

### Sanitization check (HTML should not execute)
  This should be removed or neutralized:
  <script>alert('xss')</script>
  <img src=x onerror=alert('xss')>
  <a href="javascript:alert('xss')">bad link</a>
  
  This should remain as normal Markdown:
  - `code`
  - [safe link](https://example.com)

# Demo
## Phase A
### Step A1
  detail A1
## Phase B
### Step B1
  detail B1

# Doc A
### Step 1
  a
# Doc B
### Step 2
  b