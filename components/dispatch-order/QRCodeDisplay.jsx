// QR Code functionality temporarily disabled
// This component is not currently in use but kept for future reference

// "use client";

// import { useState } from "react";
// import { Download, QrCode } from "lucide-react";
// import { Button } from "@/components/ui/button";

// export default function QRCodeDisplay({ dispatchOrder, onDownloadPDF }) {
//   const [selectedSize, setSelectedSize] = useState("medium");

//   if (!dispatchOrder?.qrCode?.dataUrl) {
//     return (
//       <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
//         <QrCode className="h-12 w-12 mx-auto text-slate-400 mb-3" />
//         <p className="text-sm text-slate-600">QR code not available</p>
//       </div>
//     );
//   }

//   const sizeClasses = {
//     small: "w-32 h-32",
//     medium: "w-48 h-48",
//     large: "w-64 h-64",
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="text-lg font-semibold text-slate-900">QR Code</h3>
//           <p className="text-sm text-slate-600">
//             Order: {dispatchOrder.orderNumber || "N/A"}
//           </p>
//         </div>
//         <div className="flex gap-2">
//           <select
//             value={selectedSize}
//             onChange={(e) => setSelectedSize(e.target.value)}
//             className="flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
//           >
//             <option value="small">Small (2x2cm)</option>
//             <option value="medium">Medium (5x5cm)</option>
//             <option value="large">Large (10x10cm)</option>
//           </select>
//           <Button
//             onClick={() => onDownloadPDF(selectedSize)}
//             className="gap-2"
//           >
//             <Download className="h-4 w-4" />
//             Download PDF
//           </Button>
//         </div>
//       </div>

//       <div className="rounded-lg border border-slate-200 bg-white p-6 flex flex-col items-center">
//         <img
//           src={dispatchOrder.qrCode.dataUrl}
//           alt={`QR Code for ${dispatchOrder.orderNumber}`}
//           className={`${sizeClasses[selectedSize]} border border-slate-200 rounded`}
//         />
//         <div className="mt-4 text-center">
//           <p className="text-sm font-medium text-slate-900">
//             {dispatchOrder.orderNumber}
//           </p>
//           <p className="text-xs text-slate-500 mt-1">
//             {dispatchOrder.totalBoxes} boxes • {dispatchOrder.totalQuantity} items
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

