export const printTable = (elementId: string) => {
  const content = document.getElementById(elementId);

  if (!content) return;

  // Work on a clone so we never touch what's actually on screen.
  const clone = content.cloneNode(true) as HTMLElement;

  // Action columns (Edit/Delete buttons) are for on-screen use only -
  // strip them out of the printed copy. Any header/cell can opt in by
  // carrying the "no-print" class.
  clone
    .querySelectorAll(".no-print")
    .forEach((el) => el.remove());

  const printWindow = window.open("", "_blank");

  if (!printWindow) return;

  // Pull in the app's own stylesheets (colored status pills, badges,
  // table styling, etc.) so the printed page matches exactly what's on
  // screen instead of a bare black-and-white table. This grabs both
  // <link rel="stylesheet"> tags and any inline <style> tags Vite/the
  // bundler has injected into the running page.
  const styleTags = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((el) => el.outerHTML)
    .join("\n");

  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>

        ${styleTags}

        <style>
          @page {
            /* Let the printer/print dialog decide the paper size and
               orientation instead of forcing one - keeps this working
               whether the user prints A4, Letter, portrait, landscape,
               color or black & white. */
            size: auto;
            margin: 10mm;
          }

          html, body{
            margin:0;
            padding:20px;
            background:#fff !important;
          }

          /* Make sure colored badges/pills print with their color
             instead of getting silently dropped - most browsers only
             need this hint plus "Background graphics" ticked in the
             print dialog. */
          *{
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          table{
            width:100%;
            border-collapse:collapse;
            table-layout:auto;
          }

          th,td{
            border:1px solid #000;
            padding:8px;
            text-align:left;
            word-break:break-word;
          }

          /* Keep header row repeating on every printed page and avoid
             splitting a row across a page break. */
          thead{
            display: table-header-group;
          }

          tr{
            page-break-inside: avoid;
          }

          /* Belt-and-braces: hide anything still carrying no-print
             even if it somehow survived the clone step above. */
          .no-print{
            display:none !important;
          }

          /* The summary cards (Total Records / Average KM % / Average
             Hours % / Poor Vehicles) are hidden on screen inside the
             printable area to avoid duplicating the ones already shown
             above the page - but they SHOULD show up on the printed
             copy, so force them back on here. Force exactly 4 columns
             (instead of the on-screen auto-fit wrap) so they always
             print as a single row. */
          .print-only-summary{
            display:grid !important;
            grid-template-columns:repeat(4, 1fr) !important;
            gap:12px !important;
            margin-bottom:20px;
          }

          .print-only-summary .summary-card{
            padding:12px !important;
          }
        </style>
      </head>
      <body>
        ${clone.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  // Give the copied stylesheets a moment to finish loading before the
  // print dialog opens, otherwise <link> based stylesheets (as opposed
  // to inline <style> tags) can print unstyled on the first attempt.
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
};