const fs = require("fs");
const path = require("path");

const pages = [
  "workers/page.tsx",
  "users/page.tsx",
  "settings/page.tsx",
  "services/page.tsx",
  "professionals/page.tsx",
  "page.tsx",
  "categories/page.tsx",
  "bookings/page.tsx"
];

let updatedCount = 0;

for (const page of pages) {
  const filePath = path.join("d:/Zarpit/ZarpitNew/app/admin", page);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, "utf8");
  
  if (!content.includes("adminFetch")) {
    const importLines = content.split("\n").filter(l => l.startsWith("import"));
    if (importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1];
      content = content.replace(lastImport, lastImport + "\nimport { adminFetch } from \"@/lib/admin-fetch\";");
    } else {
      content = "import { adminFetch } from \"@/lib/admin-fetch\";\n" + content;
    }
  }

  // Replace fetch("/api/admin...") with adminFetch("/api/admin...")
  content = content.replace(/fetch\(\s*(['"`]\/api\/admin\/)/g, "adminFetch($1");

  fs.writeFileSync(filePath, content);
  console.log("Updated", filePath);
  updatedCount++;
}
console.log("Total updated frontend:", updatedCount);
