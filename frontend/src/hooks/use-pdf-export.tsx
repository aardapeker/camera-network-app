import { useCallback, useState } from "react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import L from "leaflet";
import {
  DeviceType,
  InfrastructureType,
  SocketType,
  deviceLabels,
  deviceColors,
  infrastructureLabels,
  socketLabels,
  cameraSubtypeLabels,
} from "~/components/icons";
import { LINE_TYPE_LABELS } from "~/constants/topology";
import { SOCKET_COLORS, CABLE_COLORS_HEX, COLOR_FALLBACK_HEX } from "~/constants/colors";

// PDF-safe LINE_TYPES using hex colors (canvas cannot resolve CSS variables)
const LINE_TYPES: Record<string, { color: string; dashArray?: string }> = {
  data: { color: CABLE_COLORS_HEX.data, dashArray: undefined },
  fiber: { color: CABLE_COLORS_HEX.fiber, dashArray: "15, 5" },
  electric: { color: CABLE_COLORS_HEX.electric, dashArray: "5, 5" },
  coaxial: { color: CABLE_COLORS_HEX.coaxial, dashArray: "10, 3, 2, 3" },
};
import { getSessionToken } from "~/functions/get_session_token";
import type { LineType } from "~/types";
import type {
  ViewerDevice,
  ViewerSocket,
  ViewerInfrastructure,
  ViewerConnection,
} from "~/types/topology";

interface Topology {
  id: string;
  name: string;
  createdAt: string;
}

export interface PdfExportOptions {
  showLabels: boolean;
  /** Multiplier applied to the base icon size (1 = default, 2 = 2x, etc.) */
  iconSizeMultiplier: number;
  /** Multiplier applied to the label font size (1 = default) */
  textSizeMultiplier: number;
  /** Multiplier applied to the gap between icon and label (1 = default) */
  labelGapMultiplier: number;
  /** Whether to include device list, rack cabin list, workstation list, standalone sockets, and connection legend pages */
  includeInfoPages: boolean;
}

interface UsePdfExportProps {
  selectedTopology: Topology | null;
  clientUsername: string;
  devices: ViewerDevice[];
  infrastructure: ViewerInfrastructure[];
  sockets: ViewerSocket[];
  connections: ViewerConnection[];
  blueprintUrl: string | null;
  imageBounds: L.LatLngBoundsExpression;
}

// SVG icons as strings for each device type
export const deviceSvgIcons: Record<DeviceType, string> = {
  [DeviceType.CAMERA]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`,
  [DeviceType.SWITCH]: `<svg fill="#000000" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><path d="M33.91,18.47,30.78,8.41A2,2,0,0,0,28.87,7H7.13A2,2,0,0,0,5.22,8.41L2.09,18.48a2,2,0,0,0-.09.59V27a2,2,0,0,0,2,2H32a2,2,0,0,0,2-2V19.06A2,2,0,0,0,33.91,18.47ZM32,27H4V19.06L7.13,9H28.87L32,19.06Z"/><rect x="7.12" y="22" width="1.8" height="3"/><rect x="12.12" y="22" width="1.8" height="3"/><rect x="17.11" y="22" width="1.8" height="3"/><rect x="22.1" y="22" width="1.8" height="3"/><rect x="27.1" y="22" width="1.8" height="3"/><rect x="6.23" y="18" width="23.69" height="1.4"/></svg>`,
  [DeviceType.NVR]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>`,
  [DeviceType.ROUTER]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6.01 18H6"/><path d="M12 14v-4"/><path d="M8 10V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/></svg>`,
  [DeviceType.ACCESS_POINT]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>`,
  [DeviceType.UPS]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M15 14h.01"/><path d="M9 6h6"/><path d="M9 10h6"/></svg>`,
  [DeviceType.HORN_SPEAKER]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
};

export const cameraSubtypeSvgIcons: Record<string, string> = {
  dome: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" fill="currentColor"><path d="M15.9355 72.3C6.85984 72.3002 -0.499985 79.658 -0.49707 88.7355V332.993C-0.49707 342.071 6.86334 349.43 15.9395 349.43H68.0283V395.725C68.0283 578.776 216.952 727.698 400.002 727.698C583.051 727.698 731.975 578.776 731.975 395.725V349.43H784.064C793.14 349.43 800.5 342.071 800.5 332.993V88.7355C800.5 79.6581 793.14 72.3002 784.064 72.3H15.9355ZM699.102 395.727C699.101 560.652 564.924 694.828 400 694.828C235.076 694.828 100.899 560.651 100.898 395.727V349.431H699.102V395.727ZM767.628 316.558H32.3721L32.373 227.302H767.628V316.558ZM767.628 194.43H32.3721L32.373 105.172H767.628V194.43Z"/><path d="M567.82 369C625.817 369 673 416.183 673 474.18C673 532.177 625.817 579.359 567.82 579.359C509.823 579.359 462.641 532.177 462.641 474.18C462.641 416.183 509.823 369 567.82 369ZM567.82 547.486C608.241 547.486 641.127 514.6 641.127 474.18C641.127 433.759 608.241 400.873 567.82 400.873C527.4 400.873 494.514 433.759 494.514 474.18C494.514 514.6 527.4 547.486 567.82 547.486Z"/><path d="M136.306 369.484C145.106 369.484 152.242 376.619 152.242 385.42C152.242 485.514 211.88 575.227 304.177 613.97C312.291 617.378 316.108 626.717 312.703 634.833C310.141 640.933 304.228 644.605 298.002 644.605C295.945 644.605 293.853 644.205 291.839 643.358C187.677 599.63 120.37 498.384 120.37 385.42C120.37 376.619 127.506 369.484 136.306 369.484Z"/><path d="M357.053 646.12C357.947 637.366 365.759 630.989 374.525 631.884C382.925 632.742 391.494 633.177 399.997 633.177C408.797 633.177 415.933 640.311 415.933 649.113C415.933 657.914 408.798 665.047 399.998 665.047C390.419 665.047 380.759 664.556 371.287 663.591C362.534 662.698 356.161 654.877 357.053 646.12Z"/></svg>`,
  bullet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 435" fill="currentColor"><path d="M255.066 386.798H226.187H168.4L139.492 383.936C86.8189 368.554 53.4323 304.841 53.4323 216.899C53.4323 122.344 91.9908 55.7171 151.671 47.1568C152.422 47.0523 153.173 47 153.939 47H731.811C738.76 47 744.712 51.4827 745.998 57.6644H746.013C746.301 59.0628 752.831 92.2716 728.055 119.272C711.615 137.19 685.87 147.619 651.603 150.573C656.76 171.353 659.577 193.832 659.577 216.899C659.577 312.173 615.153 386.798 558.45 386.798H255.066ZM155.167 73.1383C120.538 78.8365 85.9954 121.272 82.6726 203.83H379.121L432.676 155.383C435.392 152.926 439.061 151.553 442.889 151.553H471.783H476.825H534.396H549.854C549.984 151.37 550.143 151.187 550.273 151.004C551.746 148.861 553.393 146.705 555.185 144.535C556.152 143.359 557.236 142.183 558.291 141.006C558.767 140.471 559.215 139.935 559.706 139.399C560.284 138.785 560.877 138.17 561.483 137.556C562.119 136.903 562.639 136.262 563.289 135.609C563.535 135.361 563.853 135.191 564.127 134.955C565.745 133.374 567.435 131.793 569.212 130.198C570.354 129.179 571.509 128.173 572.694 127.166C575.569 124.735 578.603 122.291 581.839 119.848C584.439 117.874 587.155 115.953 589.9 114.032C591.157 113.156 592.4 112.28 593.7 111.405C615.558 96.6236 640.869 83.5152 663.709 73.1383H155.167ZM544.017 199.465C544.017 226.779 552.685 244.828 558.464 252.696C564.243 244.815 572.911 226.779 572.911 199.465C572.911 188.931 571.654 180.005 569.877 172.634C569.819 172.712 569.704 172.738 569.631 172.804C568.418 174.15 566.944 175.208 565.268 176.019C564.907 176.189 564.561 176.319 564.17 176.463C562.379 177.169 560.487 177.665 558.45 177.665H545.996C544.682 184.644 544.017 191.937 544.017 199.465ZM705.634 102.805C712.597 95.3036 715.689 86.8871 717.061 79.6337C695.275 88.1025 666.367 100.623 639.713 115.13C641.129 118.345 642.429 121.677 643.7 125.049C672.652 123.376 693.441 115.914 705.634 102.805ZM630.698 216.899C630.698 185.246 625.179 154.886 615.009 129.715C614.72 129.898 614.431 130.081 614.142 130.264C605.228 136.079 597.774 141.751 591.374 147.293C596.445 158.545 601.819 176.006 601.819 199.465C601.819 243.56 581.564 282.232 558.478 282.232C535.392 282.232 515.138 243.56 515.138 199.465C515.138 192.002 515.831 184.762 516.929 177.679H489.191C487.241 190.591 486.244 203.738 486.244 216.886C486.244 297.849 525.077 360.647 558.478 360.647C592.616 360.66 630.698 301.613 630.698 216.899ZM505.401 360.66C504.996 360.229 504.635 359.68 504.231 359.235C501.471 356.216 498.799 352.975 496.227 349.538C495.794 348.963 495.346 348.466 494.912 347.878C491.951 343.788 489.148 339.383 486.461 334.77C485.739 333.541 485.089 332.221 484.395 330.954C482.459 327.412 480.61 323.766 478.848 319.976C478.096 318.355 477.36 316.721 476.637 315.062C474.918 311.089 473.329 306.985 471.812 302.777C471.321 301.391 470.772 300.058 470.31 298.66C468.417 293.04 466.712 287.263 465.195 281.304C464.892 280.115 464.675 278.886 464.386 277.697C463.245 272.848 462.219 267.908 461.338 262.863C460.991 260.838 460.688 258.799 460.37 256.76C459.691 252.199 459.128 247.572 458.68 242.894C458.492 240.907 458.261 238.934 458.116 236.921C457.625 230.334 457.307 223.669 457.307 216.899V177.692H448.842L395.287 226.139C392.571 228.596 388.902 229.968 385.073 229.968H82.6437C85.9665 312.526 120.509 354.962 155.138 360.66H255.052H505.401Z"/><path d="M283.974 321.452C275.996 321.452 269.528 315.601 269.528 308.383C269.528 301.165 275.996 295.314 283.974 295.314C291.953 295.314 298.421 301.165 298.421 308.383C298.421 315.601 291.953 321.452 283.974 321.452Z"/><path d="M341.762 321.452C333.783 321.452 327.315 315.601 327.315 308.383C327.315 301.165 333.783 295.314 341.762 295.314C349.74 295.314 356.209 301.165 356.209 308.383C356.209 315.601 349.74 321.452 341.762 321.452Z"/><path d="M399.549 321.452C391.57 321.452 385.102 315.601 385.102 308.383C385.102 301.165 391.57 295.314 399.549 295.314C407.528 295.314 413.996 301.165 413.996 308.383C413.996 315.601 407.528 321.452 399.549 321.452Z"/></svg>`,
  speed_dome: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" fill="currentColor"><path d="M103.223 0V64.5175H541.933C577.506 64.5175 606.45 93.4593 606.45 129.035V206.452H735.48V309.677H761.286C782.631 309.677 799.997 327.044 799.997 348.388L799.959 439.703L786.14 619.355H767.986C744.115 724.62 650.865 800 541.935 800C433.006 800 339.756 724.62 315.885 619.355H297.731L283.874 438.71V348.386C283.874 327.044 301.24 309.675 322.585 309.675H348.391V232.258H160.881L103.229 301.444V516.129H0.00279999V0H103.223ZM709.673 232.258H683.867V270.969H658.06V232.258H632.254V270.969H606.447V232.258H580.641V270.969H554.835V232.258H529.028V270.969H503.222V232.258H477.415V270.969H451.609V232.258H425.802V270.969H399.996V232.258H374.189V309.677H709.673V232.258ZM541.933 774.194C636.799 774.194 718.463 709.949 741.676 619.355H342.192C365.403 709.949 447.07 774.194 541.933 774.194ZM348.383 335.484H322.577C315.466 335.484 309.672 341.265 309.672 348.388L309.633 425.808H348.383V451.614H310.707L321.624 593.551H762.241L773.197 451.614H374.189V425.808H774.191V348.388C774.191 341.265 768.396 335.484 761.286 335.484H735.48H348.383ZM103.22 261.134L148.797 206.452H348.383H580.641V129.032C580.641 107.691 563.274 90.3212 541.93 90.3212H103.22V261.134ZM25.8037 490.323H77.4166V332.412V64.5175V25.8065H25.8037V490.323Z"/><path d="M396.811 651.625L419.133 638.695C423.972 647.03 429.766 655.005 436.345 662.346L417.131 679.584C409.377 670.915 402.526 661.51 396.811 651.625Z"/><path d="M449.274 707.523L463.544 686.028C510.125 716.971 573.726 716.971 620.305 686.028L634.574 707.523C607.053 725.821 575.012 735.485 541.93 735.485C508.848 735.485 476.81 725.821 449.274 707.523Z"/></svg>`,
  thermal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 786 559" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M157.439 246.912C166.819 246.857 174.38 254.249 174.317 263.424C174.266 272.596 166.598 280.088 157.232 280.153C147.852 280.208 140.291 272.817 140.343 263.645C140.406 254.47 148.061 246.98 157.439 246.912ZM225.39 246.483C234.771 246.427 242.331 253.819 242.267 262.994C242.214 272.154 234.548 279.659 225.18 279.711C215.802 279.779 208.24 272.375 208.29 263.203C208.357 254.04 216.009 246.538 225.39 246.483ZM293.34 246.052C302.719 245.985 310.281 253.389 310.228 262.549C310.164 271.724 302.509 279.213 293.132 279.281C283.75 279.337 276.19 271.945 276.254 262.77C276.304 253.598 283.96 246.109 293.34 246.052Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M293.43 408.169L263.718 408.354L233.992 408.542L132.682 409.196C129.217 409.215 125.893 407.868 123.485 405.457C121.086 403.029 119.796 399.759 119.9 396.362L120.262 385.363L121.094 360.385L121.682 342.809L88.8659 343.019C81.7639 343.062 76.0466 337.466 76.0776 330.511L76.8577 210.179C76.8981 203.508 79.6479 197.086 84.5137 192.335C89.3795 187.583 95.944 184.887 102.768 184.853L675.703 181.529C685.108 181.466 693.734 186.414 698.232 194.431C702.74 202.433 702.399 212.268 697.369 220.094L658.48 280.549L658.123 334.838C658.002 355.698 640.606 372.706 619.275 372.842L572.952 373.147L572.812 393.79C572.765 400.736 566.973 406.413 559.871 406.456L323.152 407.969L293.43 408.169ZM147.423 342.648L146.052 383.941L547.153 381.363L547.739 290.236L509.101 290.484L486.907 333.508C484.702 337.78 480.229 340.515 475.353 340.546L147.423 342.648ZM632.676 289.69L632.393 334.997C632.35 341.954 626.546 347.635 619.443 347.678L573.104 347.974L573.478 290.062L632.676 289.69ZM638.585 264.482L675.639 206.886C675.654 206.844 675.657 206.804 675.644 206.756C675.621 206.722 675.575 206.695 675.534 206.694L102.6 210.018L101.902 317.761L117.48 317.671C117.623 317.658 117.77 317.658 117.917 317.658L467.565 315.42L489.756 272.383C491.961 268.112 496.437 265.389 501.313 265.358L638.585 264.482Z"/></svg>`,
  fisheye: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M273.852 257.143H152.422C147.998 257.143 143.76 258.614 140.602 261.229C71.7394 318.286 29 397.814 29 485.714C29 659.171 195.466 800 400.5 800C605.534 800 772 659.171 772 485.714C772 397.814 729.261 318.286 660.398 261.229C657.24 258.614 653.002 257.143 648.578 257.143H527.148V142.857H687.568C715.549 142.857 738.227 123.671 738.227 100V14.2857C738.227 6.4 730.662 0 721.341 0H79.6591C70.3378 0 62.7727 6.4 62.7727 14.2857V100C62.7727 123.671 85.4511 142.857 113.432 142.857H273.852V257.143ZM603.373 714.086C603.373 714.014 603.373 713.957 603.373 713.886V614.286C603.373 568.814 582.028 525.214 544.017 493.071C506.023 460.914 454.486 442.857 400.736 442.857C400.584 442.857 400.416 442.857 400.264 442.857C346.514 442.857 294.977 460.914 256.983 493.071C218.972 525.214 197.627 568.814 197.627 614.286C197.627 668.7 197.627 713.886 197.627 713.886C197.627 713.957 197.627 714.014 197.627 714.086C254.129 750.086 324.393 771.429 400.5 771.429C476.607 771.429 546.871 750.086 603.373 714.086ZM400.5 474.243C316.625 474.243 248.523 531.857 248.523 602.814C248.523 673.771 316.625 731.386 400.5 731.386C484.375 731.386 552.477 673.771 552.477 602.814C552.477 531.857 484.375 474.243 400.5 474.243ZM400.5 502.814C465.732 502.814 518.705 547.629 518.705 602.814C518.705 658.014 465.732 702.814 400.5 702.814C335.268 702.814 282.295 658.014 282.295 602.814C282.295 547.629 335.268 502.814 400.5 502.814ZM637.145 689.486C699.524 637.614 738.227 565.457 738.227 485.714C738.227 407.886 701.347 337.271 641.604 285.729L641.587 285.714C641.587 285.714 159.413 285.714 159.397 285.729C99.6525 337.271 62.7727 407.886 62.7727 485.714C62.7727 565.457 101.476 637.614 163.854 689.486V614.286C163.854 561.243 188.762 510.371 233.089 472.871C277.432 435.357 337.565 414.286 400.264 414.286C400.416 414.286 400.584 414.286 400.736 414.286C463.435 414.286 523.568 435.357 567.911 472.871C612.238 510.371 637.145 561.243 637.145 614.286V689.486ZM620.023 328.571C629.344 328.571 636.909 334.971 636.909 342.857C636.909 350.743 629.344 357.143 620.023 357.143C610.701 357.143 603.136 350.743 603.136 342.857C603.136 334.971 610.701 328.571 620.023 328.571ZM552.477 328.571C561.799 328.571 569.364 334.971 569.364 342.857C569.364 350.743 561.799 357.143 552.477 357.143C543.156 357.143 535.591 350.743 535.591 342.857C535.591 334.971 543.156 328.571 552.477 328.571ZM493.375 257.143H307.625V142.857H493.375V257.143ZM362.506 214.286H438.494C447.816 214.286 455.381 207.886 455.381 200C455.381 192.114 447.816 185.714 438.494 185.714H362.506C353.184 185.714 345.619 192.114 345.619 200C345.619 207.886 353.184 214.286 362.506 214.286ZM214.75 28.5714H96.5455V100C96.5455 107.886 104.111 114.286 113.432 114.286H687.568C696.889 114.286 704.455 107.886 704.455 100V28.5714H586.25V42.8571C586.25 54.2286 580.914 65.1286 571.407 73.1572C561.917 81.2 549.032 85.7143 535.591 85.7143C470.882 85.7143 330.118 85.7143 265.409 85.7143C251.968 85.7143 239.083 81.2 229.593 73.1572C220.086 65.1286 214.75 54.2286 214.75 42.8571V28.5714ZM248.523 28.5714H552.477V42.8571C552.477 46.6429 550.704 50.2857 547.53 52.9571C544.372 55.6429 540.066 57.1429 535.591 57.1429H265.409C260.934 57.1429 256.628 55.6429 253.47 52.9571C250.296 50.2857 248.523 46.6429 248.523 42.8571V28.5714Z"/><ellipse cx="343.5" cy="606" rx="28.5" ry="24"/><path d="M497 606C497 619.255 484.016 630 468 630C451.984 630 439 619.255 439 606C439 592.745 451.984 582 468 582C484.016 582 497 592.745 497 606Z"/><path d="M406 520V689" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
  motorized_bullet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 774 658" fill="currentColor"><path d="M666.239 293.161L691.001 266.025C705.122 250.548 702.945 238.335 700.392 232.431C697.839 226.528 690.44 216.609 669.584 216.517L113.595 214.211C99.8328 214.149 87.0923 219.77 77.7213 230.042C68.3494 240.31 63.5092 253.955 64.0947 268.458L65.8475 312.041C65.8475 312.041 65.8478 312.045 65.8476 312.048L69.7968 410.104C71.0077 440.145 95.1809 464.688 123.69 464.816L285.728 465.478L306.96 465.566L386.384 465.891L407.608 465.977L596.966 466.753C603.156 466.78 609.047 465.656 614.468 463.568C630.909 457.237 643.005 442.058 645.865 423.398L667.598 423.494C670.052 423.505 672.424 423.068 674.63 422.219C677.384 421.158 679.879 419.456 681.954 417.182C685.692 413.086 687.621 407.626 687.386 401.811L683.875 314.613C683.448 304.008 675.856 295.128 666.239 293.161ZM663.197 314.516L666.721 401.699L646.03 401.607L642.701 318.952L646.805 314.456L663.197 314.516ZM675.76 250.548L634.465 295.8C634.461 295.805 634.458 295.809 634.455 295.813L624.565 306.651C624.561 306.655 624.558 306.658 624.554 306.662L612.96 319.369C599.354 334.279 570.88 346.8 550.78 346.711L232.588 345.471C226.881 345.45 222.449 350.31 222.694 356.327C222.94 362.345 227.767 367.24 233.478 367.264L551.662 368.504C562.736 368.554 575.308 365.814 587.418 361.151C600.657 356.053 613.329 348.649 622.877 340.086L625.79 412.411C626.516 430.436 613.191 445.036 596.085 444.96L122.808 443.024C105.705 442.948 91.2013 428.222 90.4751 410.198L88.2799 355.689C97.2025 362.584 108.109 366.702 119.738 366.754L130.08 366.799C135.786 366.827 140.222 361.966 139.979 355.949C139.737 349.932 134.911 345.033 129.201 345.008L118.861 344.962C101.76 344.885 87.2563 330.163 86.5271 312.142L86.0883 301.239L84.7718 268.552C84.4215 259.869 87.3305 251.689 92.9619 245.515C98.5938 239.343 106.234 235.965 114.475 236.003L670.464 238.31C677.527 238.341 680.761 239.964 681.577 240.706C681.562 241.814 680.542 245.305 675.76 250.548Z"/><path d="M191.234 345.286L170.553 345.192C164.843 345.164 160.411 350.024 160.652 356.041C160.894 362.058 165.719 366.958 171.429 366.984L192.111 367.078C193.353 367.084 194.534 366.857 195.621 366.439C199.528 364.934 202.2 360.936 202.011 356.228C201.77 350.211 196.945 345.313 191.234 345.286Z"/></svg>`,
};

const socketSvgIcons: Record<SocketType, string> = {
  [SocketType.CAT6]: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M460,0H52C23.28,0,0,23.28,0,52v408c0,28.72,23.28,52,52,52h408c28.72,0,52-23.28,52-52V52C512,23.28,488.72,0,460,0z M444,284h-88.024c-2.212,0-3.976,1.64-3.976,3.848V348H160v-60.152c0-2.208-1.616-3.848-3.828-3.848H68V68h44v92.184c0,6.624,5.368,12,12,12c6.624,0,12-5.376,12-12V68h20v92.184c0,6.624,5.368,12,12,12c6.624,0,12-5.376,12-12V68h20v92.184c0,6.624,5.368,12,12,12c6.624,0,12-5.376,12-12V68h20v92.184c0,6.624,5.368,12,12,12c6.624,0,12-5.376,12-12V68h20v92.184c0,6.624,5.368,12,12,12c6.624,0,12-5.376,12-12V68h20v92.184c0,6.624,5.368,12,12,12c6.624,0,12-5.376,12-12V68h20v92.184c0,6.624,5.368,12,12,12c6.624,0,12-5.376,12-12V68h44V284z"/><path d="M124,184.036c-6.632,0-12,5.376-12,12v23.752c0,6.628,5.368,12,12,12c6.624,0,12-5.372,12-12v-23.752C136,189.412,130.624,184.036,124,184.036z" opacity="0.85"/><path d="M168,184.036c-6.632,0-12,5.376-12,12v23.752c0,6.628,5.368,12,12,12c6.624,0,12-5.372,12-12v-23.752C180,189.412,174.624,184.036,168,184.036z" opacity="0.85"/><path d="M212,184.036c-6.632,0-12,5.376-12,12v23.752c0,6.628,5.368,12,12,12c6.624,0,12-5.372,12-12v-23.752C224,189.412,218.624,184.036,212,184.036z" opacity="0.85"/><path d="M256,184.036c-6.632,0-12,5.376-12,12v23.752c0,6.628,5.368,12,12,12c6.624,0,12-5.372,12-12v-23.752C268,189.412,262.624,184.036,256,184.036z" opacity="0.85"/><path d="M300,184.036c-6.632,0-12,5.376-12,12v23.752c0,6.628,5.368,12,12,12c6.624,0,12-5.372,12-12v-23.752C312,189.412,306.624,184.036,300,184.036z" opacity="0.85"/><path d="M344,184.036c-6.632,0-12,5.376-12,12v23.752c0,6.628,5.368,12,12,12c6.624,0,12-5.372,12-12v-23.752C356,189.412,350.624,184.036,344,184.036z" opacity="0.85"/><path d="M388,184.036c-6.632,0-12,5.376-12,12v23.752c0,6.628,5.368,12,12,12c6.624,0,12-5.372,12-12v-23.752C400,189.412,394.624,184.036,388,184.036z" opacity="0.85"/></svg>`,
  [SocketType.NORMAL]: `<svg viewBox="0 0 344.25 344.25" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M339.469,0H4.781v344.25h334.688V0z M176.906,51.265V76.5h-19.125V47.812h19.125z M157.781,303.705v-26.393h19.125V306h-19.125z M186.469,303.074V267.75h-38.25v34.596C88.511,292.115,43.031,240.229,43.031,177.604S88.511,63.093,148.219,52.861v33.201h38.25V52.135c62.041,8.205,109.969,61.181,109.969,125.47S248.51,294.869,186.469,303.074z"/><circle cx="100.464" cy="181.037" r="19.106"/><circle cx="243.901" cy="181.037" r="19.106"/><path d="M170.327,160.746c-9.572,0-17.346,7.784-17.346,17.356s7.774,17.355,17.346,17.355c9.572,0,17.347-7.783,17.347-17.355s-7.775-17.356-17.347-17.356zm0,25.149c-4.293,0-7.784-3.5-7.784-7.793s3.49-7.793,7.784-7.793 7.784,3.5,7.784,7.793-3.491,7.793-7.784,7.793z"/></svg>`,
  [SocketType.UPS]: `<svg viewBox="0 0 344.25 344.25" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M339.469,0H4.781v344.25h334.688V0z M176.906,51.265V76.5h-19.125V47.812h19.125z M157.781,303.705v-26.393h19.125V306h-19.125z M186.469,303.074V267.75h-38.25v34.596C88.511,292.115,43.031,240.229,43.031,177.604S88.511,63.093,148.219,52.861v33.201h38.25V52.135c62.041,8.205,109.969,61.181,109.969,125.47S248.51,294.869,186.469,303.074z"/><circle cx="100.464" cy="181.037" r="19.106"/><circle cx="243.901" cy="181.037" r="19.106"/><path d="M170.327,160.746c-9.572,0-17.346,7.784-17.346,17.356s7.774,17.355,17.346,17.355c9.572,0,17.347-7.783,17.347-17.355s-7.775-17.356-17.347-17.356zm0,25.149c-4.293,0-7.784-3.5-7.784-7.793s3.49-7.793,7.784-7.793 7.784,3.5,7.784,7.793-3.491,7.793-7.784,7.793z"/></svg>`,
};

// SVG icons for infrastructure types
const infrastructureSvgIcons: Record<InfrastructureType, string> = {
  [InfrastructureType.RACK_CABIN]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`,
  [InfrastructureType.WORKSTATION]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
};

// Socket colors for PDF export (fallback when no custom color)
const pdfSocketColors: Record<SocketType, string> = {
  [SocketType.UPS]: SOCKET_COLORS.ups,
  [SocketType.CAT6]: SOCKET_COLORS.cat6,
  [SocketType.NORMAL]: SOCKET_COLORS.normal,
};

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
function getPreferredColor(
  preferred: string | null | undefined,
  fallback: string,
): string {
  return preferred && HEX_COLOR_REGEX.test(preferred) ? preferred : fallback;
}

// Function to load SVG as image with optional color
export async function loadSvgAsImage(
  svgString: string,
  size: number,
  color?: string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const resolvedColor = color || "#000000";
    let svgWithSize = svgString
      .replace("<svg ", `<svg width="${size}" height="${size}" `)
      .replace(/fill="currentColor"/g, `fill="${resolvedColor}"`)
      .replace(/stroke="currentColor"/g, `stroke="${resolvedColor}"`);

    const blob = new Blob([svgWithSize], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG"));
    };
    img.src = url;
  });
}

export function usePdfExport({
  selectedTopology,
  clientUsername,
  devices,
  infrastructure,
  sockets,
  connections,
  blueprintUrl,
  imageBounds,
}: UsePdfExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = useCallback(async (options?: PdfExportOptions) => {
    const showLabels = options?.showLabels ?? true;
    const iconSizeMultiplier = options?.iconSizeMultiplier ?? 1;
    const textSizeMultiplier = options?.textSizeMultiplier ?? 1;
    const labelGapMultiplier = options?.labelGapMultiplier ?? 1;
    const includeInfoPages = options?.includeInfoPages ?? true;
    if (!selectedTopology || !blueprintUrl) {
      toast.error("No topology to export");
      return;
    }

    setIsExporting(true);
    toast.info("Generating PDF...");

    try {
      // Load the blueprint image via proxy to avoid CORS issues
      const proxyUrl = `/files/proxy-blueprint?url=${encodeURIComponent(blueprintUrl)}`;

      // Fetch with auth token
      const token = getSessionToken();
      const response = await fetch(proxyUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blueprint image");
      }

      // Convert response to blob and create object URL
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          URL.revokeObjectURL(objectUrl); // Clean up
          resolve(image);
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl); // Clean up
          reject(new Error("Failed to load blueprint image"));
        };
        image.src = objectUrl;
      });

      // Create canvas and draw everything manually
      // Limit canvas dimensions to avoid exceeding browser canvas size limits
      // Most browsers cap at ~16384px per side or ~268M total pixels
      const MAX_CANVAS_DIMENSION = 4096;
      const naturalWidth = img.width;
      const naturalHeight = img.height;
      let scale = 2;

      // If the scaled dimensions exceed limits, reduce the scale
      if (naturalWidth * scale > MAX_CANVAS_DIMENSION || naturalHeight * scale > MAX_CANVAS_DIMENSION) {
        scale = Math.min(
          MAX_CANVAS_DIMENSION / naturalWidth,
          MAX_CANVAS_DIMENSION / naturalHeight,
        );
      }

      const canvasWidth = Math.round(naturalWidth * scale);
      const canvasHeight = Math.round(naturalHeight * scale);
      // High-res images get larger icons (2x), low-res stay normal (1x)
      // scale=2 means small image → uiScale=1, scale<2 means large image → uiScale=2/scale
      const uiScale = 2 / scale;
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to create canvas context");
      }

      // Draw background
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw blueprint image
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      // Helper to convert lat/lng to canvas coordinates
      const bounds = imageBounds as [[number, number], [number, number]];
      const toCanvasCoords = (lat: number, lng: number): [number, number] => {
        const x = (lng / bounds[1][1]) * canvasWidth;
        const y = canvasHeight - (lat / bounds[1][0]) * canvasHeight;
        return [x, y];
      };

      // Helper to find position from devices, infrastructure, or standalone sockets for PDF export
      const findPdfPosition = (
        id: string,
      ): { id: string; lat: number; lng: number } | null => {
        const device = devices.find((d) => d.deviceId === id || d.id === id);
        if (device) return { id: device.id, lat: device.lat, lng: device.lng };
        const infra = infrastructure.find(
          (i) => i.infraId === id || i.id === id,
        );
        if (infra) return { id: infra.id, lat: infra.lat, lng: infra.lng };
        // Check standalone sockets
        const socket = sockets.find(
          (s) => (s.socketId === id || s.id === id) && !s.workstationId && s.lat != null && s.lng != null,
        );
        if (socket) return { id: socket.id, lat: socket.lat!, lng: socket.lng! };
        return null;
      };

      // Draw connections
      for (const conn of connections) {
        const sourcePos = findPdfPosition(conn.sourceDeviceId);
        const targetPos = findPdfPosition(conn.targetDeviceId);
        if (!sourcePos || !targetPos) continue;

        // Find parallel connections for offset
        const parallelConnections = connections.filter((c) => {
          const cSource = findPdfPosition(c.sourceDeviceId);
          const cTarget = findPdfPosition(c.targetDeviceId);
          if (!cSource || !cTarget) return false;
          return (
            (cSource.id === sourcePos.id && cTarget.id === targetPos.id) ||
            (cSource.id === targetPos.id && cTarget.id === sourcePos.id)
          );
        });
        const parallelIndex = parallelConnections.findIndex(
          (c) => c.id === conn.id,
        );
        const totalParallel = parallelConnections.length;
        const offsetIndex = parallelIndex - (totalParallel - 1) / 2;
        const pdfParallelOffset = 3; // Smaller gap for PDF export
        const offsetAmount = offsetIndex * pdfParallelOffset * uiScale;

        const waypoints = conn.waypoints || [];

        // Convert all points to canvas coordinates
        const [srcX, srcY] = toCanvasCoords(sourcePos.lat, sourcePos.lng);
        const [tgtX, tgtY] = toCanvasCoords(targetPos.lat, targetPos.lng);
        const waypointCoords = waypoints.map((wp) => toCanvasCoords(wp[0], wp[1]));

        // Build full path first: [source, ...waypoints, target]
        let pathPoints: [number, number][] = [
          [srcX, srcY],
          ...waypointCoords as [number, number][],
          [tgtX, tgtY],
        ];

        // Apply offset for parallel lines BEFORE shortening (per-segment perpendicular offset)
        if (totalParallel > 1) {
          pathPoints = pathPoints.map((point, i) => {
            const prevPoint = i > 0 ? pathPoints[i - 1] : null;
            const nextPoint = i < pathPoints.length - 1 ? pathPoints[i + 1] : null;
            let perpX = 0, perpY = 0, count = 0;
            if (prevPoint) {
              const dx = point[0] - prevPoint[0];
              const dy = point[1] - prevPoint[1];
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len > 0) { perpX += -dy / len; perpY += dx / len; count++; }
            }
            if (nextPoint) {
              const dx = nextPoint[0] - point[0];
              const dy = nextPoint[1] - point[1];
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len > 0) { perpX += -dy / len; perpY += dx / len; count++; }
            }
            if (count === 0) return point;
            perpX /= count;
            perpY /= count;
            return [point[0] + perpX * offsetAmount, point[1] + perpY * offsetAmount] as [number, number];
          });
        }

        // Shorten from source to first point, and from last point to target
        // This must be done AFTER offsetting to ensure proper margins
        const iconMargin = 10 * uiScale;

        let shortenedSrcX = pathPoints[0][0], shortenedSrcY = pathPoints[0][1];
        const dxFirst = pathPoints[1][0] - pathPoints[0][0];
        const dyFirst = pathPoints[1][1] - pathPoints[0][1];
        const lenFirst = Math.sqrt(dxFirst * dxFirst + dyFirst * dyFirst);
        if (lenFirst > iconMargin * 2) {
          const ratio = iconMargin / lenFirst;
          shortenedSrcX += dxFirst * ratio;
          shortenedSrcY += dyFirst * ratio;
        }

        const lastIdx = pathPoints.length - 1;
        let shortenedTgtX = pathPoints[lastIdx][0], shortenedTgtY = pathPoints[lastIdx][1];
        const dxLast = pathPoints[lastIdx - 1][0] - pathPoints[lastIdx][0];
        const dyLast = pathPoints[lastIdx - 1][1] - pathPoints[lastIdx][1];
        const lenLast = Math.sqrt(dxLast * dxLast + dyLast * dyLast);
        if (lenLast > iconMargin * 2) {
          const ratio = iconMargin / lenLast;
          shortenedTgtX += dxLast * ratio;
          shortenedTgtY += dyLast * ratio;
        }

        // Replace first and last points with shortened versions
        pathPoints[0] = [shortenedSrcX, shortenedSrcY];
        pathPoints[lastIdx] = [shortenedTgtX, shortenedTgtY];

        const typeConfig = conn.lineType
          ? LINE_TYPES[conn.lineType]
          : LINE_TYPES.data;
        const lineColor = getPreferredColor(conn.color, typeConfig.color);

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1 * uiScale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (typeConfig.dashArray) {
          const dashPattern = typeConfig.dashArray
            .split(",")
            .map((d) => parseFloat(d.trim()) * uiScale);
          ctx.setLineDash(dashPattern);
        } else {
          ctx.setLineDash([]);
        }

        // Draw multi-segment path
        ctx.beginPath();
        ctx.moveTo(pathPoints[0][0], pathPoints[0][1]);
        for (let i = 1; i < pathPoints.length; i++) {
          ctx.lineTo(pathPoints[i][0], pathPoints[i][1]);
        }
        ctx.stroke();

        // Draw cable name label at path midpoint
        if (conn.name) {
          let totalLen = 0;
          const segLengths: number[] = [];
          for (let i = 1; i < pathPoints.length; i++) {
            const dx = pathPoints[i][0] - pathPoints[i - 1][0];
            const dy = pathPoints[i][1] - pathPoints[i - 1][1];
            const len = Math.sqrt(dx * dx + dy * dy);
            segLengths.push(len);
            totalLen += len;
          }
          const labelT =
            totalParallel <= 1
              ? 0.5
              : 0.3 + (parallelIndex / (totalParallel - 1)) * 0.4;
          const targetDist = totalLen * labelT;
          let labelX = pathPoints[pathPoints.length - 1][0];
          let labelY = pathPoints[pathPoints.length - 1][1];
          let acc = 0;
          for (let i = 0; i < segLengths.length; i++) {
            if (acc + segLengths[i] >= targetDist) {
              const rem = targetDist - acc;
              const frac = segLengths[i] > 0 ? rem / segLengths[i] : 0;
              labelX = pathPoints[i][0] + (pathPoints[i + 1][0] - pathPoints[i][0]) * frac;
              labelY = pathPoints[i][1] + (pathPoints[i + 1][1] - pathPoints[i][1]) * frac;
              break;
            }
            acc += segLengths[i];
          }
          const fontSize = 10 * uiScale;
          ctx.font = `600 ${fontSize}px sans-serif`;
          const textMetrics = ctx.measureText(conn.name);
          const padX = 2 * uiScale;
          const padY = 1.5 * uiScale;
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fillRect(
            labelX - padX,
            labelY - fontSize + padY,
            textMetrics.width + padX * 2,
            fontSize + padY,
          );
          ctx.fillStyle = lineColor;
          ctx.fillText(conn.name, labelX, labelY);
        }
      }

      // Reset line dash
      ctx.setLineDash([]);

      const iconSize = 12 * uiScale * iconSizeMultiplier;
      const deviceIconCache = new Map<string, HTMLImageElement>();
      const socketIconCache = new Map<string, HTMLImageElement>();
      const infraIconCache = new Map<string, HTMLImageElement>();

      async function getOrLoadDeviceIcon(
        type: DeviceType,
        color: string | null | undefined,
        subtype?: string | null,
      ): Promise<HTMLImageElement | undefined> {
        const colorKey = color && HEX_COLOR_REGEX.test(color) ? color : "default";
        const key = `${type}-${subtype || ""}-${colorKey}`;
        let img = deviceIconCache.get(key);
        if (!img) {
          try {
            const svgString = (type === DeviceType.CAMERA && subtype && cameraSubtypeSvgIcons[subtype])
              ? cameraSubtypeSvgIcons[subtype]
              : deviceSvgIcons[type];
            if (svgString) {
              img = await loadSvgAsImage(
                svgString,
                iconSize,
                colorKey === "default" ? "#000000" : colorKey,
              );
              deviceIconCache.set(key, img);
            }
          } catch {
            // ignore
          }
        }
        return img;
      }

      async function getOrLoadSocketIcon(
        type: SocketType,
        color: string | null | undefined,
      ): Promise<HTMLImageElement | undefined> {
        const resolvedColor = getPreferredColor(color, pdfSocketColors[type]);
        const key = `${type}-${resolvedColor}`;
        let img = socketIconCache.get(key);
        if (!img) {
          try {
            const svgString = socketSvgIcons[type];
            if (svgString) {
              img = await loadSvgAsImage(svgString, iconSize, resolvedColor);
              socketIconCache.set(key, img);
            }
          } catch {
            // ignore
          }
        }
        return img;
      }

      async function getOrLoadInfraIcon(
        type: InfrastructureType,
        color: string | null | undefined,
      ): Promise<HTMLImageElement | undefined> {
        const colorKey = color && HEX_COLOR_REGEX.test(color) ? color : "default";
        const key = `${type}-${colorKey}`;
        let img = infraIconCache.get(key);
        if (!img) {
          try {
            const svgString = infrastructureSvgIcons[type];
            if (svgString) {
              img = await loadSvgAsImage(
                svgString,
                iconSize,
                colorKey === "default" ? "#000000" : colorKey,
              );
              infraIconCache.set(key, img);
            }
          } catch {
            // ignore
          }
        }
        return img;
      }

      // Draw device markers with icons - only standalone devices (not in rack cabins)
      const standaloneDevices = devices.filter((d) => !d.rackCabinId);
      for (const device of standaloneDevices) {
        const [x, y] = toCanvasCoords(device.lat, device.lng);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((device.rotation * Math.PI) / 180);
        const sx = device.flipX ? -1 : 1;
        const sy = device.flipY ? -1 : 1;
        if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);

        // Draw the icon directly (no background circle) - use device's preferred color
        const iconImg = await getOrLoadDeviceIcon(device.type, device.color, device.subtype);
        if (iconImg) {
          ctx.drawImage(
            iconImg,
            -iconSize / 2,
            -iconSize / 2,
            iconSize,
            iconSize,
          );
        }

        ctx.restore();

        if (showLabels) {
          // Draw device label with background for visibility
          const labelText = device.label.substring(0, 15);
          const fontSize = 5 * uiScale * textSizeMultiplier;
          ctx.font = `bold ${fontSize}px Arial`;

          const labelPosition = device.labelPosition || "bottom";
          const distance = 18 * uiScale * labelGapMultiplier;
          let labelX = x;
          let labelY = y;

          // Position label based on labelPosition setting
          switch (labelPosition) {
            case "top":
              labelY = y - iconSize / 2 - distance;
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";
              break;
            case "bottom":
              labelY = y + iconSize / 2 + distance;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              break;
            case "left":
              labelX = x - iconSize / 2 - distance;
              ctx.textAlign = "right";
              ctx.textBaseline = "middle";
              break;
            case "right":
              labelX = x + iconSize / 2 + distance;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              break;
          }

          const textMetrics = ctx.measureText(labelText);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;
          const padding = 1.5 * uiScale;
          const lineLength = distance;

          // Clamp label to stay within canvas bounds
          if (labelPosition === "top") {
            // Keep label above icon but don't let it go off the top edge
            labelY = Math.max(labelY, textHeight + padding);
          } else if (labelPosition === "right") {
            const maxX = canvasWidth - textWidth - padding;
            if (labelX > maxX) labelX = maxX;
          }

          // Draw label background
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          let bgX, bgY, bgWidth, bgHeight;

          if (labelPosition === "left" || labelPosition === "right") {
            bgX = labelX - (labelPosition === "left" ? textWidth + padding : padding);
            bgY = labelY - textHeight / 2 - padding / 2;
            bgWidth = textWidth + padding * 2;
            bgHeight = textHeight + padding;
          } else {
            bgX = labelX - textWidth / 2 - padding;
            bgY = labelY - (labelPosition === "top" ? textHeight + padding / 2 : padding / 2);
            bgWidth = textWidth + padding * 2;
            bgHeight = textHeight + padding;
          }

          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

          // Draw connector line from icon to label
          ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          switch (labelPosition) {
            case "top":
              ctx.moveTo(x, y - iconSize / 2);
              ctx.lineTo(x, y - iconSize / 2 - lineLength);
              break;
            case "bottom":
              ctx.moveTo(x, y + iconSize / 2);
              ctx.lineTo(x, y + iconSize / 2 + lineLength);
              break;
            case "left":
              ctx.moveTo(x - iconSize / 2, y);
              ctx.lineTo(x - iconSize / 2 - lineLength, y);
              break;
            case "right":
              ctx.moveTo(x + iconSize / 2, y);
              ctx.lineTo(x + iconSize / 2 + lineLength, y);
              break;
          }
          ctx.stroke();

          // Draw label text
          ctx.fillStyle = "#ffffff";
          ctx.fillText(labelText, labelX, labelY);
        }
      }

      // Draw infrastructure markers with icons - use infra's preferred color
      for (const infra of infrastructure) {
        const [x, y] = toCanvasCoords(infra.lat, infra.lng);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((infra.rotation * Math.PI) / 180);
        const infraSx = infra.flipX ? -1 : 1;
        const infraSy = infra.flipY ? -1 : 1;
        if (infraSx !== 1 || infraSy !== 1) ctx.scale(infraSx, infraSy);

        // Draw the icon directly (no background circle)
        const iconImg = await getOrLoadInfraIcon(infra.type, infra.color);
        if (iconImg) {
          ctx.drawImage(
            iconImg,
            -iconSize / 2,
            -iconSize / 2,
            iconSize,
            iconSize,
          );
        }

        ctx.restore();

        // Get child devices for this infrastructure (rack cabin)
        const childDevices = devices
          .filter((d) => d.rackCabinId === infra.infraId)
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

        // Get child sockets for this infrastructure (workstation)
        const childSockets = sockets
          .filter((s) => s.workstationId === infra.infraId)
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

        // Draw child device icons vertically with per-type xN badges (only for RACK_CABIN)
        if (
          infra.type === InfrastructureType.RACK_CABIN &&
          childDevices.length > 0
        ) {
          const miniIconSize = 9 * uiScale;
          const badgePadding = 3 * uiScale;
          const rowGap = 2 * uiScale;

          // Group child devices by type with count
          const deviceGroups: Record<string, number> = {};
          for (const d of childDevices) {
            deviceGroups[d.type] = (deviceGroups[d.type] || 0) + 1;
          }
          const groupedEntries = Object.entries(deviceGroups) as [DeviceType, number][];

          // Measure badge dimensions
          ctx.font = `bold ${5 * uiScale}px Arial`;
          const badgeTextHeight = 5 * uiScale;
          const rowHeight = Math.max(miniIconSize, badgeTextHeight + badgePadding) + rowGap;
          let maxRowWidth = 0;
          for (const [, count] of groupedEntries) {
            const countText = `x${count}`;
            const textW = ctx.measureText(countText).width;
            const rowWidth = miniIconSize + 3 * uiScale + textW + badgePadding * 2;
            if (rowWidth > maxRowWidth) maxRowWidth = rowWidth;
          }

          const totalHeight = groupedEntries.length * rowHeight - rowGap;
          const totalWidth = maxRowWidth + badgePadding * 2;
          const badgeX = x + iconSize / 2 + 10 * uiScale;
          const badgeTopY = y - totalHeight / 2;

          // Draw badge background
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.beginPath();
          ctx.roundRect(
            badgeX,
            badgeTopY - badgePadding,
            totalWidth,
            totalHeight + badgePadding * 2,
            6 * uiScale,
          );
          ctx.fill();
          ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw each row: icon + xN badge
          let currentY = badgeTopY;
          for (const [deviceType, count] of groupedEntries) {
            const firstDeviceOfType = childDevices.find((d) => d.type === deviceType);
            const deviceColor = firstDeviceOfType?.color;
            const miniIcon = await getOrLoadDeviceIcon(deviceType, deviceColor, firstDeviceOfType?.subtype);
            const rowCenterY = currentY + miniIconSize / 2;

            if (miniIcon) {
              ctx.drawImage(
                miniIcon,
                badgeX + badgePadding,
                rowCenterY - miniIconSize / 2,
                miniIconSize,
                miniIconSize,
              );
            }

            // Draw xN pill badge
            const countText = `x${count}`;
            ctx.font = `bold ${5 * uiScale}px Arial`;
            const textW = ctx.measureText(countText).width;
            const pillW = textW + badgePadding * 2;
            const pillH = badgeTextHeight + badgePadding;
            const pillX = badgeX + badgePadding + miniIconSize + 2 * uiScale;
            const pillY = rowCenterY - pillH / 2;

            // Resolve the badge color from deviceColors
            const resolvedColor = deviceColors[deviceType] || COLOR_FALLBACK_HEX;
            ctx.fillStyle = resolvedColor;
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, pillH, 4 * uiScale);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(countText, pillX + pillW / 2, rowCenterY);

            currentY += rowHeight;
          }
        }

        // Draw child socket icons vertically with per-type xN badges (only for WORKSTATION)
        if (
          infra.type === InfrastructureType.WORKSTATION &&
          childSockets.length > 0
        ) {
          const miniIconSize = 9 * uiScale;
          const badgePadding = 3 * uiScale;
          const rowGap = 2 * uiScale;

          // Group child sockets by type with count
          const socketGroups: Record<string, number> = {};
          for (const s of childSockets) {
            socketGroups[s.type] = (socketGroups[s.type] || 0) + 1;
          }
          const groupedEntries = Object.entries(socketGroups) as [SocketType, number][];

          // Measure badge dimensions
          ctx.font = `bold ${5 * uiScale}px Arial`;
          const badgeTextHeight = 5 * uiScale;
          const rowHeight = Math.max(miniIconSize, badgeTextHeight + badgePadding) + rowGap;
          let maxRowWidth = 0;
          for (const [, count] of groupedEntries) {
            const countText = `x${count}`;
            const textW = ctx.measureText(countText).width;
            const rowWidth = miniIconSize + 3 * uiScale + textW + badgePadding * 2;
            if (rowWidth > maxRowWidth) maxRowWidth = rowWidth;
          }

          const totalHeight = groupedEntries.length * rowHeight - rowGap;
          const totalWidth = maxRowWidth + badgePadding * 2;
          const badgeX = x + iconSize / 2 + 10 * uiScale;
          const badgeTopY = y - totalHeight / 2;

          // Draw badge background
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.beginPath();
          ctx.roundRect(
            badgeX,
            badgeTopY - badgePadding,
            totalWidth,
            totalHeight + badgePadding * 2,
            6 * uiScale,
          );
          ctx.fill();
          ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw each row: icon + xN badge
          let currentY = badgeTopY;
          for (const [socketType, count] of groupedEntries) {
            const firstSocketOfType = childSockets.find((s) => s.type === socketType);
            const socketColor = firstSocketOfType?.color;
            const miniIcon = await getOrLoadSocketIcon(socketType, socketColor);
            const rowCenterY = currentY + miniIconSize / 2;

            if (miniIcon) {
              ctx.drawImage(
                miniIcon,
                badgeX + badgePadding,
                rowCenterY - miniIconSize / 2,
                miniIconSize,
                miniIconSize,
              );
            }

            // Draw xN pill badge
            const countText = `x${count}`;
            ctx.font = `bold ${5 * uiScale}px Arial`;
            const textW = ctx.measureText(countText).width;
            const pillW = textW + badgePadding * 2;
            const pillH = badgeTextHeight + badgePadding;
            const pillX = badgeX + badgePadding + miniIconSize + 2 * uiScale;
            const pillY = rowCenterY - pillH / 2;

            // Resolve the badge color from pdfSocketColors
            const resolvedColor = pdfSocketColors[socketType] || COLOR_FALLBACK_HEX;
            ctx.fillStyle = resolvedColor;
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, pillH, 4 * uiScale);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(countText, pillX + pillW / 2, rowCenterY);

            currentY += rowHeight;
          }
        }

        if (showLabels) {
          // Draw infrastructure label with background for visibility
          const labelText = infra.label.substring(0, 15);
          const fontSize = 5 * uiScale * textSizeMultiplier;
          ctx.font = `bold ${fontSize}px Arial`;

          const labelPosition = infra.labelPosition || "bottom";
          const distance = 18 * uiScale * labelGapMultiplier;
          let labelX = x;
          let labelY = y;

          // Position label based on labelPosition setting
          switch (labelPosition) {
            case "top":
              labelY = y - iconSize / 2 - distance;
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";
              break;
            case "bottom":
              labelY = y + iconSize / 2 + distance;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              break;
            case "left":
              labelX = x - iconSize / 2 - distance;
              ctx.textAlign = "right";
              ctx.textBaseline = "middle";
              break;
            case "right":
              labelX = x + iconSize / 2 + distance;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              break;
          }

          const textMetrics = ctx.measureText(labelText);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;
          const padding = 2 * uiScale;
          const lineLength = distance;

          // Clamp label to stay within canvas bounds
          if (labelPosition === "top") {
            // Keep label above icon but don't let it go off the top edge
            labelY = Math.max(labelY, textHeight + padding);
          } else if (labelPosition === "right") {
            const maxX = canvasWidth - textWidth - padding;
            if (labelX > maxX) labelX = maxX;
          }

          // Draw label background
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          let bgX, bgY, bgWidth, bgHeight;

          if (labelPosition === "left" || labelPosition === "right") {
            bgX = labelX - (labelPosition === "left" ? textWidth + padding : padding);
            bgY = labelY - textHeight / 2 - padding / 2;
            bgWidth = textWidth + padding * 2;
            bgHeight = textHeight + padding;
          } else {
            bgX = labelX - textWidth / 2 - padding;
            bgY = labelY - (labelPosition === "top" ? textHeight + padding / 2 : padding / 2);
            bgWidth = textWidth + padding * 2;
            bgHeight = textHeight + padding;
          }

          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

          // Draw connector line from icon to label
          ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          switch (labelPosition) {
            case "top":
              ctx.moveTo(x, y - iconSize / 2);
              ctx.lineTo(x, y - iconSize / 2 - lineLength);
              break;
            case "bottom":
              ctx.moveTo(x, y + iconSize / 2);
              ctx.lineTo(x, y + iconSize / 2 + lineLength);
              break;
            case "left":
              ctx.moveTo(x - iconSize / 2, y);
              ctx.lineTo(x - iconSize / 2 - lineLength, y);
              break;
            case "right":
              ctx.moveTo(x + iconSize / 2, y);
              ctx.lineTo(x + iconSize / 2 + lineLength, y);
              break;
          }
          ctx.stroke();

          // Draw label text
          ctx.fillStyle = "#ffffff";
          ctx.fillText(labelText, labelX, labelY);
        }
      }

      // Draw standalone socket markers - use socket's preferred color
      const standaloneSockets = sockets.filter(
        (s) => !s.workstationId && s.lat != null && s.lng != null,
      );
      for (const socket of standaloneSockets) {
        const [x, y] = toCanvasCoords(socket.lat!, socket.lng!);

        ctx.save();
        ctx.translate(x, y);

        // Draw the socket icon
        const socketIcon = await getOrLoadSocketIcon(socket.type, socket.color);
        if (socketIcon) {
          ctx.drawImage(
            socketIcon,
            -iconSize / 2,
            -iconSize / 2,
            iconSize,
            iconSize,
          );
        }

        ctx.restore();

        if (showLabels) {
          // Draw socket label with background for visibility
          const labelText = socket.label.substring(0, 15);
          const fontSize = 5 * uiScale * textSizeMultiplier;
          ctx.font = `bold ${fontSize}px Arial`;

          const labelPosition = socket.labelPosition || "bottom";
          const distance = 18 * uiScale * labelGapMultiplier;
          let labelX = x;
          let labelY = y;

          // Position label based on labelPosition setting
          switch (labelPosition) {
            case "top":
              labelY = y - iconSize / 2 - distance;
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";
              break;
            case "bottom":
              labelY = y + iconSize / 2 + distance;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              break;
            case "left":
              labelX = x - iconSize / 2 - distance;
              ctx.textAlign = "right";
              ctx.textBaseline = "middle";
              break;
            case "right":
              labelX = x + iconSize / 2 + distance;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              break;
          }

          const textMetrics = ctx.measureText(labelText);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;
          const padding = 2 * uiScale;

          const socketLineLength = 10 * uiScale;

          // Clamp label position to stay within canvas bounds
          if (labelPosition === "top") {
            const minY = textHeight + padding + socketLineLength + iconSize / 2;
            if (labelY < minY) labelY = minY;
          } else if (labelPosition === "right") {
            const maxX = canvasWidth - textWidth - padding;
            if (labelX > maxX) labelX = maxX;
          }

          // Draw label background
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          let bgX, bgY, bgWidth, bgHeight;

          if (labelPosition === "left" || labelPosition === "right") {
            bgX = labelX - (labelPosition === "left" ? textWidth + padding : padding);
            bgY = labelY - textHeight / 2 - padding / 2;
            bgWidth = textWidth + padding * 2;
            bgHeight = textHeight + padding;
          } else {
            bgX = labelX - textWidth / 2 - padding;
            bgY = labelY - (labelPosition === "top" ? textHeight + padding / 2 : padding / 2);
            bgWidth = textWidth + padding * 2;
            bgHeight = textHeight + padding;
          }

          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

          // Draw connector line from icon to label
          ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          switch (labelPosition) {
            case "top":
              ctx.moveTo(x, y - iconSize / 2);
              ctx.lineTo(x, y - iconSize / 2 - socketLineLength);
              break;
            case "bottom":
              ctx.moveTo(x, y + iconSize / 2);
              ctx.lineTo(x, y + iconSize / 2 + socketLineLength);
              break;
            case "left":
              ctx.moveTo(x - iconSize / 2, y);
              ctx.lineTo(x - iconSize / 2 - socketLineLength, y);
              break;
            case "right":
              ctx.moveTo(x + iconSize / 2, y);
              ctx.lineTo(x + iconSize / 2 + socketLineLength, y);
              break;
          }
          ctx.stroke();

          // Draw label text
          ctx.fillStyle = "#ffffff";
          ctx.fillText(labelText, labelX, labelY);
        }
      }

      // Create PDF in landscape orientation for better map display
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Load and register Roboto font for full Unicode / Turkish character support
      // Two separate TTF files are required — jsPDF needs distinct files per style
      const toBase64 = (buffer: ArrayBuffer): string =>
        btoa(new Uint8Array(buffer).reduce((s, b) => s + String.fromCharCode(b), ""));
      try {
        const [regularRes, boldRes] = await Promise.all([
          fetch("/Roboto-Regular.ttf"),
          fetch("/Roboto-Bold.ttf"),
        ]);
        if (regularRes.ok && boldRes.ok) {
          const [regularBase64, boldBase64] = await Promise.all([
            regularRes.arrayBuffer().then(toBase64),
            boldRes.arrayBuffer().then(toBase64),
          ]);
          pdf.addFileToVFS("Roboto-Regular.ttf", regularBase64);
          pdf.addFileToVFS("Roboto-Bold.ttf", boldBase64);
          pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
          pdf.addFont("Roboto-Bold.ttf", "Roboto", "bold");
          pdf.setFont("Roboto", "normal");
        }
      } catch {
        // Fall back to helvetica if font load fails
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const headerHeight = 25; // Height reserved for title and metadata

      // Load the app logo once for reuse
      let logoImg: HTMLImageElement | null = null;
      try {
        logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = "/logo.png";
        });
      } catch (error) {
        console.warn("Failed to load logo:", error);
      }

      // Helper function to add ghost logo watermark to current page
      const addGhostLogo = () => {
        if (!logoImg) return;

        // Calculate watermark size (large, centered)
        const watermarkHeight = pageHeight * 0.4; // 40% of page height
        const watermarkWidth = (logoImg.width / logoImg.height) * watermarkHeight;
        const watermarkX = (pageWidth - watermarkWidth) / 2;
        const watermarkY = (pageHeight - watermarkHeight) / 2;

        // Save current graphics state
        pdf.saveGraphicsState();

        // Set opacity for ghost effect (10% opacity)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));

        // Add centered ghost logo
        pdf.addImage(
          logoImg,
          "PNG",
          watermarkX,
          watermarkY,
          watermarkWidth,
          watermarkHeight,
        );

        // Restore graphics state
        pdf.restoreGraphicsState();
      };

      // Add logo to top-right corner
      if (logoImg) {
        const logoHeight = 15; // mm
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        pdf.addImage(
          logoImg,
          "PNG",
          pageWidth - margin - logoWidth,
          margin,
          logoWidth,
          logoHeight,
        );
      }

      // Add title
      pdf.setFont("Roboto", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(33, 33, 33);
      pdf.text(selectedTopology.name, margin, margin + 5);

      // Add metadata on a single line
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      const metadataText = `Client: ${clientUsername} | Created: ${new Date(selectedTopology.createdAt).toLocaleDateString()} | Devices: ${devices.length} | Connections: ${connections.length} | Exported: ${new Date().toLocaleString()}`;
      pdf.text(metadataText, margin, margin + 12);

      // Calculate where the image starts
      const imageStartY = margin + headerHeight;

      // Calculate image dimensions to fit the page
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      const maxImgHeight = pageHeight - imageStartY - margin; // Available space for image

      let finalImgWidth = imgWidth;
      let finalImgHeight = imgHeight;

      if (imgHeight > maxImgHeight) {
        finalImgHeight = maxImgHeight;
        finalImgWidth = (canvas.width / canvas.height) * finalImgHeight;
      }

      // Center the image horizontally
      const imgX = (pageWidth - finalImgWidth) / 2;

      // Add the map image
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      pdf.addImage(
        imgData,
        "JPEG",
        imgX,
        imageStartY,
        finalImgWidth,
        finalImgHeight,
      );

      // Add ghost logo to first page AFTER the blueprint image
      addGhostLogo();

      if (includeInfoPages) {
      // Natural-order label comparator so "Cam 2" sorts before "Cam 10"
      // instead of lexicographically after it.
      const byLabel = (a: string, b: string) =>
        (a || "").localeCompare(b || "", undefined, {
          numeric: true,
          sensitivity: "base",
        });

      // Footnote registry — every component note gets a sequential marker that is
      // printed next to the component name and expanded in the Notes section at
      // the end of the document (book-style footnotes).
      const footnotes: { index: number; label: string; note: string }[] = [];
      const footnoteIndexById = new Map<string, number>();
      /**
       * Registers a note and returns its footnote marker (e.g. " [3]").
       * Returns "" when the component has no note, so it can be appended blindly.
       */
      const noteMarker = (
        id: string,
        label: string,
        note: string | null | undefined,
      ): string => {
        const trimmed = note?.trim();
        if (!trimmed) return "";
        let index = footnoteIndexById.get(id);
        if (index === undefined) {
          index = footnotes.length + 1;
          footnoteIndexById.set(id, index);
          footnotes.push({ index, label, note: trimmed });
        }
        return ` [${index}]`;
      };

      // Add new page for device list
      pdf.addPage();
      addGhostLogo();

      // Device list header
      pdf.setFont("Roboto", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(33, 33, 33);
      pdf.text("Device List", margin, margin + 5);

      // Device table
      let yPos = margin + 15;
      const lineHeight = 7;
      const colWidths = [35, 28, 28, 60, 65, 40];

      // Table header
      pdf.setFontSize(10);
      pdf.setFont("Roboto", "bold");
      pdf.text("Device Name", margin, yPos);
      pdf.text("Type", margin + colWidths[0], yPos);
      pdf.text("Brand", margin + colWidths[0] + colWidths[1], yPos);
      pdf.text("Model", margin + colWidths[0] + colWidths[1] + colWidths[2], yPos);
      pdf.text("Serial No", margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos);
      pdf.text("IP Address", margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], yPos);

      // Header underline
      yPos += 2;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += lineHeight;

      // Device rows (sorted by name, natural order so Cam2 precedes Cam10)
      pdf.setFontSize(8);
      pdf.setFont("Roboto", "normal");
      const sortedDevices = [...devices].sort((a, b) =>
        byLabel(a.label, b.label),
      );
      for (const device of sortedDevices) {
        if (yPos > pageHeight - margin - 10) {
          pdf.addPage();
          addGhostLogo();
          yPos = margin + 10;
        }

        const fitText = (text: string, colWidth: number) => {
          const maxW = colWidth - 2;
          const fullWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
          if (fullWidth > maxW) {
            const ratio = maxW / fullWidth;
            const fitted = Math.floor(text.length * ratio);
            return text.substring(0, Math.max(fitted - 1, 1)) + "…";
          }
          return text;
        };
        const deviceMarker = noteMarker(
          device.deviceId || device.id,
          device.label,
          device.note,
        );
        pdf.text(fitText(device.label + deviceMarker, colWidths[0]), margin, yPos);
        pdf.text(
          fitText((device.type === DeviceType.CAMERA && device.subtype && cameraSubtypeLabels[device.subtype as keyof typeof cameraSubtypeLabels]) || deviceLabels[device.type] || device.type, colWidths[1]),
          margin + colWidths[0],
          yPos,
        );
        pdf.text(fitText(device.brand || "-", colWidths[2]), margin + colWidths[0] + colWidths[1], yPos);
        pdf.text(fitText(device.model || "-", colWidths[3]), margin + colWidths[0] + colWidths[1] + colWidths[2], yPos);
        pdf.text(fitText(device.serialNumber || "-", colWidths[4]), margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos);
        pdf.text(
          fitText(device.ipAddress || "-", colWidths[5]),
          margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
          yPos,
        );
        yPos += lineHeight;
      }

      // Add Rack Cabin List section
      const rackCabins = infrastructure
        .filter((i) => i.type === InfrastructureType.RACK_CABIN)
        .sort((a, b) => byLabel(a.label, b.label));
      if (rackCabins.length > 0) {
        yPos += 10;
        if (yPos > pageHeight - margin - 30) {
          pdf.addPage();
          addGhostLogo();
          yPos = margin + 10;
        }

        pdf.setFontSize(14);
        pdf.setFont("Roboto", "bold");
        pdf.setTextColor(33, 33, 33);
        pdf.text("Rack Cabin List", margin, yPos);
        yPos += 10;

        for (const cabin of rackCabins) {
          if (yPos > pageHeight - margin - 20) {
            pdf.addPage();
            addGhostLogo();
            yPos = margin + 10;
          }

          pdf.setFontSize(11);
          pdf.setFont("Roboto", "bold");
          pdf.setTextColor(33, 33, 33);
          pdf.text(
            cabin.label +
              noteMarker(cabin.infraId || cabin.id, cabin.label, cabin.note),
            margin,
            yPos,
          );
          yPos += lineHeight;

          const childDevices = devices
            .filter((d) => d.rackCabinId === cabin.infraId)
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
          if (childDevices.length > 0) {
            pdf.setFontSize(9);
            pdf.setFont("Roboto", "bold");
            pdf.setTextColor(60, 60, 60);
            pdf.text("Device Name", margin + 5, yPos);
            pdf.text("Type", margin + 50, yPos);
            pdf.text("Brand", margin + 90, yPos);
            pdf.text("Model", margin + 120, yPos);
            pdf.text("Serial No", margin + 150, yPos);
            pdf.text("IP", margin + 185, yPos);
            yPos += lineHeight - 1;

            pdf.setFont("Roboto", "normal");
            for (const device of childDevices) {
              if (yPos > pageHeight - margin - 10) {
                pdf.addPage();
                addGhostLogo();
                yPos = margin + 10;
              }
              pdf.text(
                (device.label || "-").substring(0, 18) +
                  noteMarker(
                    device.deviceId || device.id,
                    device.label,
                    device.note,
                  ),
                margin + 5,
                yPos,
              );
              pdf.text((device.type === DeviceType.CAMERA && device.subtype && cameraSubtypeLabels[device.subtype as keyof typeof cameraSubtypeLabels]) || deviceLabels[device.type] || device.type, margin + 50, yPos);
              pdf.text((device.brand || "-").substring(0, 10), margin + 90, yPos);
              pdf.text(device.model || "-", margin + 120, yPos);
              pdf.text(device.serialNumber || "-", margin + 150, yPos);
              pdf.text(device.ipAddress || "-", margin + 185, yPos);
              yPos += lineHeight - 1;
            }
          } else {
            pdf.setFontSize(9);
            pdf.setFont("Roboto", "normal");
            pdf.setTextColor(100, 100, 100);
            pdf.text("No devices", margin + 5, yPos);
            yPos += lineHeight;
          }

          // Port Connections for this rack cabin
          const cabinetConns = connections.filter(
            (c) =>
              c.sourceDeviceId === cabin.infraId ||
              c.targetDeviceId === cabin.infraId,
          );

          if (cabinetConns.length > 0) {
            yPos += 3;
            if (yPos > pageHeight - margin - 20) {
              pdf.addPage();
              addGhostLogo();
              yPos = margin + 10;
            }

            pdf.setFontSize(9);
            pdf.setFont("Roboto", "bold");
            pdf.setTextColor(60, 60, 60);
            pdf.text(
              `Port Connections (${cabinetConns.length})`,
              margin + 5,
              yPos,
            );
            yPos += lineHeight - 1;

            // Table header
            pdf.setFontSize(8);
            pdf.setFont("Roboto", "bold");
            pdf.setTextColor(80, 80, 80);
            pdf.text("Cable Name", margin + 5, yPos);
            pdf.text("Remote Device", margin + 50, yPos);
            pdf.text("Cable Type", margin + 100, yPos);
            pdf.text("Switch", margin + 145, yPos);
            pdf.text("Port", margin + 190, yPos);
            yPos += 1;
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin + 5, yPos, margin + 210, yPos);
            yPos += lineHeight - 2;

            pdf.setFont("Roboto", "normal");
            for (const conn of cabinetConns) {
              if (yPos > pageHeight - margin - 10) {
                pdf.addPage();
                addGhostLogo();
                yPos = margin + 10;
              }

              // Determine which side is the cabinet and which is remote
              const isCabinetSource =
                conn.sourceDeviceId === cabin.infraId;
              const remoteDeviceId = isCabinetSource
                ? conn.targetDeviceId
                : conn.sourceDeviceId;
              const port = isCabinetSource
                ? conn.sourcePort
                : conn.targetPort;
              const internalDeviceId = isCabinetSource
                ? conn.sourceInternalDeviceId
                : conn.targetInternalDeviceId;

              // Resolve remote device name (could be a device, infrastructure, or socket)
              const remoteDevice = devices.find(
                (d) => d.deviceId === remoteDeviceId || d.id === remoteDeviceId,
              );
              const remoteInfra = !remoteDevice
                ? infrastructure.find(
                    (i) => i.infraId === remoteDeviceId || i.id === remoteDeviceId,
                  )
                : undefined;
              const remoteName = remoteDevice
                ? remoteDevice.label
                : remoteInfra
                  ? remoteInfra.label
                  : remoteDeviceId.substring(0, 15);

              // Resolve internal device (switch) name
              let internalName = "—";
              if (internalDeviceId) {
                const internalDevice = childDevices.find(
                  (d) =>
                    d.deviceId === internalDeviceId ||
                    d.id === internalDeviceId,
                );
                if (internalDevice) {
                  internalName = internalDevice.label;
                }
              }

              // Cable name and type
              const cableName = conn.name || "—";
              const lineType = conn.lineType || "data";
              const cableLabel =
                LINE_TYPE_LABELS[lineType as LineType] || lineType;

              // Port number
              const portStr =
                port != null ? `Port ${port}` : "—";

              pdf.setFontSize(8);
              pdf.setTextColor(33, 33, 33);
              pdf.text(
                cableName.substring(0, 18),
                margin + 5,
                yPos,
              );
              pdf.text(
                remoteName.substring(0, 18),
                margin + 50,
                yPos,
              );
              pdf.text(cableLabel, margin + 100, yPos);
              pdf.text(
                internalName.substring(0, 15),
                margin + 145,
                yPos,
              );
              pdf.text(portStr, margin + 190, yPos);
              yPos += lineHeight - 1;
            }
          }

          yPos += 3;
        }
      }

      // Add Workstation List section
      const workstations = infrastructure
        .filter((i) => i.type === InfrastructureType.WORKSTATION)
        .sort((a, b) => byLabel(a.label, b.label));
      if (workstations.length > 0) {
        yPos += 10;
        if (yPos > pageHeight - margin - 30) {
          pdf.addPage();
          addGhostLogo();
          yPos = margin + 10;
        }

        pdf.setFontSize(14);
        pdf.setFont("Roboto", "bold");
        pdf.setTextColor(33, 33, 33);
        pdf.text("Workstation List", margin, yPos);
        yPos += 10;

        for (const workstation of workstations) {
          if (yPos > pageHeight - margin - 20) {
            pdf.addPage();
            addGhostLogo();
            yPos = margin + 10;
          }

          pdf.setFontSize(11);
          pdf.setFont("Roboto", "bold");
          pdf.setTextColor(33, 33, 33);
          pdf.text(
            workstation.label +
              noteMarker(
                workstation.infraId || workstation.id,
                workstation.label,
                workstation.note,
              ),
            margin,
            yPos,
          );
          yPos += lineHeight;

          const childSockets = sockets
            .filter((s) => s.workstationId === workstation.infraId)
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
          if (childSockets.length > 0) {
            pdf.setFontSize(9);
            pdf.setFont("Roboto", "bold");
            pdf.setTextColor(60, 60, 60);
            pdf.text("Socket Name", margin + 5, yPos);
            pdf.text("Type", margin + 55, yPos);
            pdf.text("Note", margin + 100, yPos);
            yPos += lineHeight - 1;

            pdf.setFont("Roboto", "normal");
            for (const socket of childSockets) {
              if (yPos > pageHeight - margin - 10) {
                pdf.addPage();
                addGhostLogo();
                yPos = margin + 10;
              }
              pdf.text(
                (socket.label || "-").substring(0, 20) +
                  noteMarker(
                    socket.socketId || socket.id,
                    socket.label,
                    socket.note,
                  ),
                margin + 5,
                yPos,
              );
              pdf.text(
                socketLabels[socket.type] || socket.type,
                margin + 55,
                yPos,
              );
              pdf.text(
                (socket.note || "-").substring(0, 30),
                margin + 100,
                yPos,
              );
              yPos += lineHeight - 1;
            }
          } else {
            pdf.setFontSize(9);
            pdf.setFont("Roboto", "normal");
            pdf.setTextColor(100, 100, 100);
            pdf.text("No sockets", margin + 5, yPos);
            yPos += lineHeight;
          }
          yPos += 3;
        }
      }

      // Add Standalone Sockets List section
      const standaloneSocketsList = sockets
        .filter((s) => !s.workstationId && s.lat != null && s.lng != null)
        .sort((a, b) => byLabel(a.label, b.label));
      if (standaloneSocketsList.length > 0) {
        yPos += 10;
        if (yPos > pageHeight - margin - 30) {
          pdf.addPage();
          addGhostLogo();
          yPos = margin + 10;
        }

        pdf.setFontSize(14);
        pdf.setFont("Roboto", "bold");
        pdf.setTextColor(33, 33, 33);
        pdf.text("Standalone Sockets", margin, yPos);
        yPos += 10;

        // Table header
        pdf.setFontSize(9);
        pdf.setFont("Roboto", "bold");
        pdf.setTextColor(60, 60, 60);
        pdf.text("Socket Name", margin, yPos);
        pdf.text("Type", margin + 50, yPos);
        pdf.text("Note", margin + 100, yPos);
        yPos += lineHeight - 1;

        pdf.setFont("Roboto", "normal");
        for (const socket of standaloneSocketsList) {
          if (yPos > pageHeight - margin - 10) {
            pdf.addPage();
            addGhostLogo();
            yPos = margin + 10;
          }
          pdf.text(
            (socket.label || "-").substring(0, 20) +
              noteMarker(socket.socketId || socket.id, socket.label, socket.note),
            margin,
            yPos,
          );
          pdf.text(socketLabels[socket.type] || socket.type, margin + 50, yPos);
          pdf.text((socket.note || "-").substring(0, 30), margin + 100, yPos);
          yPos += lineHeight - 1;
        }
      }

      // Add connection legend if there are connections (use same colors as on map)
      if (connections.length > 0) {
        yPos += 10;
        if (yPos > pageHeight - margin - 30) {
          pdf.addPage();
          addGhostLogo();
          yPos = margin + 10;
        }

        pdf.setFontSize(14);
        pdf.setFont("Roboto", "bold");
        pdf.text("Connection Types", margin, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        pdf.setFont("Roboto", "normal");

        // Build legend entries with actual colors used on the map (lineType + resolved color)
        const legendSeen = new Set<string>();
        const legendEntries: { lineType: LineType; color: string }[] = [];
        for (const conn of connections) {
          const lineType = (conn.lineType || "data") as LineType;
          const typeConfig = LINE_TYPES[lineType];
          const color = getPreferredColor(conn.color, typeConfig.color);
          const key = `${lineType}-${color}`;
          if (!legendSeen.has(key)) {
            legendSeen.add(key);
            legendEntries.push({ lineType, color });
          }
        }

        // Helper: hex to RGB for jsPDF setDrawColor
        const hexToRgb = (hex: string): [number, number, number] => {
          const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return m
            ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
            : [0, 0, 0];
        };

        // Scale factor for dash pattern in legend (jsPDF unit is mm; keep pattern visible)
        const legendDashScale = 0.25;

        for (const entry of legendEntries) {
          const label = LINE_TYPE_LABELS[entry.lineType];
          const [r, g, b] = hexToRgb(entry.color);
          const typeConfig = LINE_TYPES[entry.lineType];

          // Use same dash pattern as on map (solid, dashed, dotted, etc.)
          if (typeConfig.dashArray) {
            const dashNums = typeConfig.dashArray
              .split(",")
              .map((d) => parseFloat(d.trim()) * legendDashScale);
            pdf.setLineDashPattern(dashNums, 0);
          } else {
            pdf.setLineDashPattern([], 0);
          }

          // Draw colored line with same color and style as on map
          pdf.setDrawColor(r, g, b);
          pdf.setLineWidth(1);
          pdf.line(margin, yPos - 2, margin + 15, yPos - 2);

          // Reset to solid for any following drawing
          pdf.setLineDashPattern([], 0);

          // Draw label
          pdf.setTextColor(33, 33, 33);
          pdf.text(label, margin + 20, yPos);
          yPos += lineHeight;
        }
      }

      // Catch notes on components that never appeared in any table above so no
      // note is silently dropped from the export.
      for (const device of devices) {
        noteMarker(device.deviceId || device.id, device.label, device.note);
      }
      for (const infra of infrastructure) {
        noteMarker(infra.infraId || infra.id, infra.label, infra.note);
      }
      for (const socket of sockets) {
        noteMarker(socket.socketId || socket.id, socket.label, socket.note);
      }

      // Notes section — full, untruncated footnote text for every component note
      if (footnotes.length > 0) {
        pdf.addPage();
        addGhostLogo();
        yPos = margin + 5;

        pdf.setFontSize(14);
        pdf.setFont("Roboto", "bold");
        pdf.setTextColor(33, 33, 33);
        pdf.text("Notes", margin, yPos);
        yPos += 10;

        const markerWidth = 12;
        const labelWidth = 45;
        const noteX = margin + markerWidth + labelWidth;
        const noteWidth = pageWidth - margin - noteX;

        for (const footnote of footnotes) {
          pdf.setFontSize(9);
          pdf.setFont("Roboto", "normal");
          const noteLines = pdf.splitTextToSize(footnote.note, noteWidth) as string[];
          const blockHeight = Math.max(noteLines.length, 1) * 5;

          if (yPos + blockHeight > pageHeight - margin) {
            pdf.addPage();
            addGhostLogo();
            yPos = margin + 10;
          }

          // Marker
          pdf.setFont("Roboto", "bold");
          pdf.setTextColor(33, 33, 33);
          pdf.text(`[${footnote.index}]`, margin, yPos);

          // Component name
          pdf.setFont("Roboto", "bold");
          pdf.setTextColor(60, 60, 60);
          pdf.text(
            pdf.splitTextToSize(footnote.label, labelWidth - 3)[0] as string,
            margin + markerWidth,
            yPos,
          );

          // Note body
          pdf.setFont("Roboto", "normal");
          pdf.setTextColor(80, 80, 80);
          pdf.text(noteLines, noteX, yPos);

          yPos += blockHeight + 2;
        }
      }
      } // end includeInfoPages

      // Save the PDF — keep Unicode letters/digits (Turkish chars included) and
      // only strip characters that are actually illegal in file names.
      const safeName = selectedTopology.name
        .replace(/[<>:"/\\|?* -]/g, "_") // reserved on Windows/POSIX
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 100)
        .replace(/^[._]+/, "")
        .replace(/[._]+$/, "");
      const fileName = safeName ? `${safeName}_topology.pdf` : "topology.pdf";
      pdf.save(fileName);

      toast.success("PDF exported successfully");
    } catch {
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }, [
    selectedTopology,
    clientUsername,
    devices,
    infrastructure,
    sockets,
    connections,
    blueprintUrl,
    imageBounds,
  ]);

  return {
    isExporting,
    handleExportPdf,
  };
}
