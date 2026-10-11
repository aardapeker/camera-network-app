// import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
// import { Button } from "../ui/button";
// import { DropdownMenu, DropdownMenuTrigger } from "../ui/dropdown-menu";

// export default function DataTableSort() {

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button
//           variant="outline"
//           size="sm"
//           className="ml-auto h-8 lg:flex mr-2"
//           disabled={isLoading}
//         >
//           {sorting.length > 0 ? (
//             sorting[0].desc ? (
//               <ArrowDown className="h-4 w-4" />
//             ) : (
//               <ArrowUp className="h-4 w-4" />
//             )
//           ) : (
//             <ChevronsUpDown className="h-4 w-4" />
//           )}
//           Sort
//           {sorting.length > 0 && (
//             <Badge variant="secondary" className="ml-1 h-5 px-1.5">
//               1
//             </Badge>
//           )}
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end" className="w-[200px]">
//         <div className="p-2">
//           <div className="font-medium mb-2">Sort by</div>

//           <DropdownMenuItem
//             // onClick={() => handleSortingChange([{ id: "id", desc: false }])}
//             className="flex items-center justify-between"
//           >
//             <span>ID</span>
//             {sorting[0]?.id === "id" &&
//               (sorting[0].desc ? (
//                 <ArrowDown className="h-4 w-4" />
//               ) : (
//                 <ArrowUp className="h-4 w-4" />
//               ))}
//           </DropdownMenuItem>

//           <DropdownMenuItem
//             // onClick={() => handleSortingChange([{ id: "username", desc: false }])}
//             className="flex items-center justify-between"
//           >
//             <span>Username (A-Z)</span>
//             {sorting[0]?.id === "username" && !sorting[0].desc && (
//               <Check className="h-4 w-4" />
//             )}
//           </DropdownMenuItem>

//           <DropdownMenuItem
//             // onClick={() => handleSortingChange([{ id: "username", desc: true }])}
//             className="flex items-center justify-between"
//           >
//             <span>Username (Z-A)</span>
//             {sorting[0]?.id === "username" && sorting[0].desc && (
//               <Check className="h-4 w-4" />
//             )}
//           </DropdownMenuItem>

//           <DropdownMenuItem
//             // onClick={() => handleSortingChange([{ id: "email", desc: false }])}
//             className="flex items-center justify-between"
//           >
//             <span>Email (A-Z)</span>
//             {sorting[0]?.id === "email" && !sorting[0].desc && (
//               <Check className="h-4 w-4" />
//             )}
//           </DropdownMenuItem>

//           <DropdownMenuItem
//             // onClick={() => handleSortingChange([{ id: "email", desc: true }])}
//             className="flex items-center justify-between"
//           >
//             <span>Email (Z-A)</span>
//             {sorting[0]?.id === "email" && sorting[0].desc && (
//               <Check className="h-4 w-4" />
//             )}
//           </DropdownMenuItem>

//           <DropdownMenuItem
//             // onClick={() => handleSortingChange([{ id: "firstName", desc: false }])}
//             className="flex items-center justify-between"
//           >
//             <span>First Name (A-Z)</span>
//             {sorting[0]?.id === "firstName" && !sorting[0].desc && (
//               <Check className="h-4 w-4" />
//             )}
//           </DropdownMenuItem>

//           <DropdownMenuItem
//             // onClick={() => handleSortingChange([{ id: "firstName", desc: true }])}
//             className="flex items-center justify-between"
//           >
//             <span>First Name (Z-A)</span>
//             {sorting[0]?.id === "firstName" && sorting[0].desc && (
//               <Check className="h-4 w-4" />
//             )}
//           </DropdownMenuItem>

//           <div className="border-t border-muted-foreground/20 mt-2 pt-2">
//             <Button
//               variant="ghost"
//               size="sm"
//               className="w-full justify-start font-normal"
//               // onClick={() => handleSortingChange([])}
//               disabled={sorting.length === 0}
//             >
//               Clear sorting
//             </Button>
//           </div>
//         </div>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }
