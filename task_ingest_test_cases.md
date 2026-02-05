# Rail Task List Examples

This file provides examples of valid Markdown formats recognized by Rail. You can copy and paste these into the Task Editor.

## Example 1: Basic Task List
### Set up development environment
  Install Node.js and dependencies.
  Check if the .env file is configured correctly.
### Initialize project structure
  Create basic folder hierarchy (src, assets, config).
### Implement core logic
  Write the main entry point and service layer.

---

## Example 2: Grouped Tasks
## Infrastructure
### Provision cloud resources
  Set up EC2 instances and RDS database.
### Configure security groups
  Open ports 80, 443, and 22 for allowed IPs.

## Backend
### Set up API Gateway
  Configure routes and lambda integrations.
### Implement User Auth
  Set up Cognito and JWT verification logic.

---

## Example 3: Rich Details (Markdown)
### Build UI Dashboard
  - [ ] Use Tailwind CSS for styling.
  - [ ] Support **Dark Mode**.
  - [ ] Add `Lucide` icons for navigation.
  - See documentation at [UI Docs](https://example.com).

### Fix Memory Leak in Worker
  Check the following code block:
  ```js
  while(true) {
    // Potential issue here
    processData(); 
  }
  ```

---

## Example 4: Raw Text (For AI Convert Test)
> Copy this text, paste it into the Editor, and check the "AI Convert" toggle to test the intelligent ingestion.

I need to finish the deployment today. First, I have to SSH into the new server and install the basic environment (Nginx/PHP). After that, I'll need to transfer the local build files to the /var/www/html folder. Oh, don't forget to check the database connection strings in the config file, they might be pointing to the wrong IP. Once the site is up, run the smoke tests and if everything looks good, back up the logs and clear the temp folder.
