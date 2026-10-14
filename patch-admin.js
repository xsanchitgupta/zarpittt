const fs = require("fs");
const path = require("path");

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith("route.ts")) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync("d:/Zarpit/ZarpitNew/app/api/admin");
let updatedCount = 0;

for (const file of files) {
  if (file.includes("update-provider") || file.includes("update-profile")) continue;
  
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("verifyAdmin")) continue;

  // Add import
  const importLines = content.split("\n").filter(l => l.startsWith("import"));
  const lastImport = importLines[importLines.length - 1];
  content = content.replace(lastImport, lastImport + "\nimport { verifyAdmin } from \"@/lib/admin-auth\";");

  // Replace methods to ensure they have a request parameter
  content = content.replace(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\(\)\s*\{/g, "export async function $1(req: Request) {");
  
  const checkCode = "\n  if (!(await verifyAdmin(req))) {\n    return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n  }\n";
  content = content.replace(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)\s*\{/g, "export async function $1($2) {" + checkCode);

  fs.writeFileSync(file, content);
  console.log("Updated", file);
  updatedCount++;
}
console.log("Total updated:", updatedCount);
