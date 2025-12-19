// QR Code functionality temporarily disabled
// This utility is not currently in use but kept for future reference

// "use client";

// import jsPDF from "jspdf";

// export function generateQRCodePDF(qrCodeDataUrl, orderNumber, totalBoxes, size = "medium") {
//   const pdf = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: "a4",
//   });

//   // Size configurations in mm
//   const sizeConfigs = {
//     small: {
//       qrSize: 20, // 2cm
//       labelWidth: 50,
//       labelHeight: 30,
//       colsPerRow: 4,
//       fontSize: 8,
//     },
//     medium: {
//       qrSize: 50, // 5cm
//       labelWidth: 100,
//       labelHeight: 80,
//       colsPerRow: 2,
//       fontSize: 12,
//     },
//     large: {
//       qrSize: 100, // 10cm
//       labelWidth: 100,
//       labelHeight: 120,
//       colsPerRow: 1,
//       fontSize: 14,
//     },
//   };

//   const config = sizeConfigs[size];
//   const pageWidth = 210; // A4 width in mm
//   const pageHeight = 297; // A4 height in mm
//   const margin = 10;
//   const spacing = 5;

//   // Calculate how many labels fit per page
//   const labelsPerRow = config.colsPerRow;
//   const availableWidth = pageWidth - 2 * margin;
//   const labelSpacing = (availableWidth - labelsPerRow * config.labelWidth) / (labelsPerRow + 1);

//   let currentY = margin;
//   let currentX = margin + labelSpacing;
//   let labelsGenerated = 0;
//   const labelsNeeded = Math.max(totalBoxes, 1); // At least 1 label

//   // Convert data URL to image
//   const img = new Image();
//   img.src = qrCodeDataUrl;

//   return new Promise((resolve, reject) => {
//     img.onload = () => {
//       try {
//         for (let i = 0; i < labelsNeeded; i++) {
//           // Check if we need a new page
//           if (currentY + config.labelHeight > pageHeight - margin) {
//             pdf.addPage();
//             currentY = margin;
//             currentX = margin + labelSpacing;
//           }

//           // Draw QR code
//           const qrX = currentX + (config.labelWidth - config.qrSize) / 2;
//           const qrY = currentY + 5;
//           pdf.addImage(img, "PNG", qrX, qrY, config.qrSize, config.qrSize);

//           // Draw order number below QR code
//           const textY = qrY + config.qrSize + 5;
//           pdf.setFontSize(config.fontSize);
//           pdf.setFont("helvetica", "bold");
//           pdf.text(orderNumber, currentX + config.labelWidth / 2, textY, {
//             align: "center",
//           });

//           // Draw box info
//           pdf.setFont("helvetica", "normal");
//           pdf.setFontSize(config.fontSize - 2);
//           pdf.text(
//             `Box ${i + 1} of ${totalBoxes}`,
//             currentX + config.labelWidth / 2,
//             textY + 5,
//             { align: "center" }
//           );

//           // Move to next position
//           currentX += config.labelWidth + labelSpacing;
//           labelsGenerated++;

//           // Move to next row if needed
//           if (labelsGenerated % labelsPerRow === 0) {
//             currentX = margin + labelSpacing;
//             currentY += config.labelHeight + spacing;
//           }
//         }

//         // Save PDF
//         pdf.save(`QR-Code-${orderNumber}-${size}.pdf`);
//         resolve();
//       } catch (error) {
//         reject(error);
//       }
//     };

//     img.onerror = () => {
//       reject(new Error("Failed to load QR code image"));
//     };
//   });
// }

