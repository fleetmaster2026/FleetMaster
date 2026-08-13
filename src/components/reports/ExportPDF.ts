import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToPDF = (
  title: string,
  headers: string[],
  rows: (string | number)[][]
) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title, 14, 18);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
    },
  });

  doc.save(`${title}.pdf`);
};