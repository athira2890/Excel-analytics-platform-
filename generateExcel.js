import XLSX from "xlsx";

const data = [
  { Name: "John", Sales: 1200, Month: "Jan" },
  { Name: "Mary", Sales: 1500, Month: "Feb" },
  { Name: "Alex", Sales: 1800, Month: "Mar" }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, "sales.xlsx");
console.log("sales.xlsx created!");
