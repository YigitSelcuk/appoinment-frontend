import React, { useState, useEffect, useRef } from "react";
import {
  Navbar as BootstrapNavbar,
  Nav,
  NavDropdown,
  Container,
  Offcanvas,
  Button,
} from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import { getAvatarUrl } from "../../services/profileService";

const Navbar = ({ user, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const rawMenuItems = [
    {
      id: "dashboard",
      name: "DASHBOARD",
      path: "/dashboard",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1 10H7C7.55 10 8 9.55 8 9V1C8 0.45 7.55 0 7 0H1C0.45 0 0 0.45 0 1V9C0 9.55 0.45 10 1 10ZM1 18H7C7.55 18 8 17.55 8 17V13C8 12.45 7.55 12 7 12H1C0.45 12 0 12.45 0 13V17C0 17.55 0.45 18 1 18ZM11 18H17C17.55 18 18 17.55 18 17V9C18 8.45 17.55 8 17 8H11C10.45 8 10 8.45 10 9V17C10 17.55 10.45 18 11 18ZM10 1V5C10 5.55 10.45 6 11 6H17C17.55 6 18 5.55 18 5V1C18 0.45 17.55 0 17 0H11C10.45 0 10 0.45 10 1Z"
            fill="#F66700"
          />
        </svg>
      ),
      color: "#F66700",
    },
    {
      id: "appointments",
      name: "RANDEVULAR",
      path: "/appointments",
      icon: (
        <svg
          width="20"
          height="21"
          viewBox="0 0 20 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M17.4666 2.23366H16.3999V1.20033C16.3999 0.631992 15.9199 0.166992 15.3332 0.166992C14.7466 0.166992 14.2666 0.631992 14.2666 1.20033V2.23366H5.73324V1.20033C5.73324 0.631992 5.25324 0.166992 4.66657 0.166992C4.0799 0.166992 3.5999 0.631992 3.5999 1.20033V2.23366H2.53324C1.34924 2.23366 0.410569 3.16366 0.410569 4.30033L0.399902 18.767C0.399902 19.9037 1.34924 20.8337 2.53324 20.8337H17.4666C18.6399 20.8337 19.5999 19.9037 19.5999 18.767V4.30033C19.5999 3.16366 18.6399 2.23366 17.4666 2.23366ZM17.4666 17.7337C17.4666 18.302 16.9866 18.767 16.3999 18.767H3.5999C3.01324 18.767 2.53324 18.302 2.53324 17.7337V7.40033H17.4666V17.7337ZM4.66657 9.46699H6.7999V11.5337H4.66657V9.46699ZM8.93324 9.46699H11.0666V11.5337H8.93324V9.46699ZM13.1999 9.46699H15.3332V11.5337H13.1999V9.46699Z"
            fill="#3C02AA"
          />
        </svg>
      ),
      color: "#3C02AA",
    },
    {
      id: "tasks",
      name: "GÖREV",
      path: "/tasks",
      icon: (
        <svg
          width="22"
          height="24"
          viewBox="0 0 22 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.666504 2.66634C0.666504 2.0475 0.912336 1.45401 1.34992 1.01643C1.78751 0.57884 2.381 0.333008 2.99984 0.333008H16.9998C17.6187 0.333008 18.2122 0.57884 18.6498 1.01643C19.0873 1.45401 19.3332 2.0475 19.3332 2.66634V9.66634H16.9998V2.66634H2.99984V21.333H8.83317V23.6663H2.99984C2.381 23.6663 1.78751 23.4205 1.34992 22.9829C0.912336 22.5453 0.666504 21.9518 0.666504 21.333V2.66634ZM5.33317 7.33301C5.33317 7.02359 5.45609 6.72684 5.67488 6.50805C5.89367 6.28926 6.19042 6.16634 6.49984 6.16634H13.4998C13.8093 6.16634 14.106 6.28926 14.3248 6.50805C14.5436 6.72684 14.6665 7.02359 14.6665 7.33301C14.6665 7.64243 14.5436 7.93917 14.3248 8.15797C14.106 8.37676 13.8093 8.49967 13.4998 8.49967H6.49984C6.19042 8.49967 5.89367 8.37676 5.67488 8.15797C5.45609 7.93917 5.33317 7.64243 5.33317 7.33301ZM5.33317 11.9997C5.33317 11.6903 5.45609 11.3935 5.67488 11.1747C5.89367 10.9559 6.19042 10.833 6.49984 10.833H7.6665C7.97592 10.833 8.27267 10.9559 8.49146 11.1747C8.71025 11.3935 8.83317 11.6903 8.83317 11.9997C8.83317 12.3091 8.71025 12.6058 8.49146 12.8246C8.27267 13.0434 7.97592 13.1663 7.6665 13.1663H6.49984C6.19042 13.1663 5.89367 13.0434 5.67488 12.8246C5.45609 12.6058 5.33317 12.3091 5.33317 11.9997ZM15.8332 14.333C14.9049 14.333 14.0147 14.7018 13.3583 15.3581C12.7019 16.0145 12.3332 16.9048 12.3332 17.833C12.3332 18.7613 12.7019 19.6515 13.3583 20.3079C14.0147 20.9643 14.9049 21.333 15.8332 21.333C16.7614 21.333 17.6517 20.9643 18.308 20.3079C18.9644 19.6515 19.3332 18.7613 19.3332 17.833C19.3332 16.9048 18.9644 16.0145 18.308 15.3581C17.6517 14.7018 16.7614 14.333 15.8332 14.333ZM9.99984 17.833C9.99984 16.2859 10.6144 14.8022 11.7084 13.7082C12.8023 12.6143 14.2861 11.9997 15.8332 11.9997C17.3803 11.9997 18.864 12.6143 19.958 13.7082C21.0519 14.8022 21.6665 16.2859 21.6665 17.833C21.6665 19.3801 21.0519 20.8638 19.958 21.9578C18.864 23.0518 17.3803 23.6663 15.8332 23.6663C14.2861 23.6663 12.8023 23.0518 11.7084 21.9578C10.6144 20.8638 9.99984 19.3801 9.99984 17.833ZM15.8332 14.9163C16.1426 14.9163 16.4393 15.0393 16.6581 15.2581C16.8769 15.4768 16.9998 15.7736 16.9998 16.083V16.6663C17.3093 16.6663 17.606 16.7893 17.8248 17.0081C18.0436 17.2268 18.1665 17.5236 18.1665 17.833C18.1665 18.1424 18.0436 18.4392 17.8248 18.658C17.606 18.8768 17.3093 18.9997 16.9998 18.9997H15.8332C15.5238 18.9997 15.227 18.8768 15.0082 18.658C14.7894 18.4392 14.6665 18.1424 14.6665 17.833V16.083C14.6665 15.7736 14.7894 15.4768 15.0082 15.2581C15.227 15.0393 15.5238 14.9163 15.8332 14.9163Z"
            fill="#3C02AA"
          />
        </svg>
      ),
      color: "#3C02AA",
    },
    {
      id: "contacts",
      name: "REHBER",
      path: "/contacts",
      icon: (
        <svg
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16.4336 19.24H3.105C2.54672 19.24 2.0113 19.0182 1.61654 18.6235C1.22178 18.2287 1 17.6933 1 17.135C1 16.5767 1.22178 16.0413 1.61654 15.6465C2.0113 15.2518 2.54672 15.03 3.105 15.03H15.0307M15.0307 15.03C15.4028 15.03 15.7596 14.8822 16.0227 14.6191C16.2858 14.356 16.4336 13.9992 16.4336 13.6271V2.40286C16.4336 2.0308 16.2858 1.67397 16.0227 1.41089C15.7596 1.1478 15.4028 1 15.0307 1H3.105C2.55668 1.00018 2.03008 1.21438 1.63732 1.597C1.24456 1.97962 1.01666 2.50044 1.00214 3.04857V17.0786M15.0307 15.03V19.24"
            stroke="#3C02AA"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.43653 11.8288C9.91207 12.0302 10.4394 12.0749 10.942 11.9565C11.4447 11.8381 11.8966 11.5627 12.2322 11.1702L12.5837 10.8174C12.7371 10.6945 12.837 10.517 12.8626 10.3221C12.8882 10.1272 12.8374 9.92997 12.7208 9.77167L11.5837 8.63596C11.4255 8.51926 11.2284 8.46821 11.0335 8.49351C10.8386 8.5188 10.6611 8.61847 10.538 8.77167C10.4149 8.92448 10.2376 9.02388 10.0431 9.04916C9.8485 9.07445 9.65169 9.02366 9.49367 8.90739L7.67367 7.09167C7.55696 6.93355 7.50592 6.73642 7.53121 6.54152C7.55651 6.34663 7.65618 6.16906 7.80938 6.04596C7.96281 5.92306 8.06276 5.7456 8.08832 5.55069C8.11388 5.35578 8.06307 5.15855 7.94653 5.00025L6.80938 3.8631C6.65108 3.74656 6.45384 3.69575 6.25894 3.72131C6.06403 3.74687 5.88656 3.84682 5.76367 4.00024L5.41367 4.34882C5.02246 4.68537 4.74789 5.13717 4.62932 5.63941C4.51075 6.14166 4.55428 6.66855 4.75367 7.14453C5.90613 9.06655 7.51451 10.6749 9.43653 11.8274V11.8288Z"
            stroke="#3C02AA"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      color: "#3C02AA",
    },
    {
      id: "cvbank",
      name: "CV BANK",
      path: "/cv",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.80004 6.35008C8.36004 6.35008 8.81004 5.90008 8.81004 5.34008C8.81004 4.78008 8.36004 4.33008 7.80004 4.33008C7.24004 4.33008 6.79004 4.78008 6.79004 5.34008C6.79004 5.90008 7.24004 6.35008 7.80004 6.35008Z"
            fill="#3C02AA"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.83 8.55043C9.83 7.47043 8.92 6.69043 7.8 6.69043C6.68 6.69043 5.77 7.47043 5.77 8.55043V9.06043C5.77 9.15043 5.81 9.24043 5.87 9.30043C5.93 9.36043 6.02 9.40043 6.11 9.40043H9.49C9.58 9.40043 9.67 9.36043 9.73 9.30043C9.79 9.24043 9.83 9.15043 9.83 9.06043V8.55043ZM5.75 11.5004C5.75 11.3015 5.82902 11.1108 5.96967 10.9701C6.11032 10.8294 6.30109 10.7504 6.5 10.7504H13.5C13.6989 10.7504 13.8897 10.8294 14.0303 10.9701C14.171 11.1108 14.25 11.3015 14.25 11.5004C14.25 11.6993 14.171 11.8901 14.0303 12.0308C13.8897 12.1714 13.6989 12.2504 13.5 12.2504H6.5C6.30109 12.2504 6.11032 12.1714 5.96967 12.0308C5.82902 11.8901 5.75 11.6993 5.75 11.5004ZM5.75 14.5004C5.75 14.3015 5.82902 14.1108 5.96967 13.9701C6.11032 13.8294 6.30109 13.7504 6.5 13.7504H13.5C13.6989 13.7504 13.8897 13.8294 14.0303 13.9701C14.171 14.1108 14.25 14.3015 14.25 14.5004C14.25 14.6993 14.171 14.8901 14.0303 15.0308C13.8897 15.1714 13.6989 15.2504 13.5 15.2504H6.5C6.30109 15.2504 6.11032 15.1714 5.96967 15.0308C5.82902 14.8901 5.75 14.6993 5.75 14.5004Z"
            fill="#3C02AA"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.5 2.5C2.5 1.398 3.398 0.5 4.5 0.5H11.19C11.752 0.5 12.282 0.738 12.655 1.131L12.661 1.138L16.973 5.84C17.332 6.223 17.5 6.724 17.5 7.2V17.5C17.5 18.602 16.602 19.5 15.5 19.5H4.5C3.398 19.5 2.5 18.602 2.5 17.5V2.5ZM11.189 2.5H4.5V17.5H15.5V7.192L11.204 2.507L11.201 2.506C11.1974 2.50335 11.1933 2.50133 11.189 2.5Z"
            fill="#3C02AA"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.1904 0.5C11.4556 0.5 11.71 0.605357 11.8975 0.792893C12.0851 0.98043 12.1904 1.23478 12.1904 1.5V6.2H16.5004C16.6318 6.2 16.7618 6.22587 16.8831 6.27612C17.0044 6.32638 17.1147 6.40003 17.2075 6.49289C17.3004 6.58575 17.3741 6.69599 17.4243 6.81732C17.4746 6.93864 17.5004 7.06868 17.5004 7.2C17.5004 7.33132 17.4746 7.46136 17.4243 7.58268C17.3741 7.70401 17.3004 7.81425 17.2075 7.90711C17.1147 7.99997 17.0044 8.07362 16.8831 8.12388C16.7618 8.17413 16.6318 8.2 16.5004 8.2H11.1904C10.9252 8.2 10.6709 8.09464 10.4833 7.90711C10.2958 7.71957 10.1904 7.46522 10.1904 7.2V1.5C10.1904 1.23478 10.2958 0.98043 10.4833 0.792893C10.6709 0.605357 10.9252 0.5 11.1904 0.5Z"
            fill="#3C02AA"
          />
        </svg>
      ),
      color: "#3C02AA",
    },
    {
      id: "requests",
      name: "TALEP",
      path: "/requests",
      icon: (
        <svg
          width="15"
          height="21"
          viewBox="0 0 15 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.7616 14.64L12.1098 12.99C13.176 10.995 12.9057 8.475 11.2238 6.795C10.7364 6.30405 10.1562 5.91467 9.51689 5.64946C8.87761 5.38424 8.19198 5.24846 7.49976 5.25C7.45471 5.25 7.40966 5.265 7.36461 5.265L9.0014 6.9L7.40966 8.49L3.16001 4.245L7.40966 0L9.0014 1.59L7.55982 3.03C9.46691 3.045 11.359 3.75 12.8156 5.19C15.3684 7.755 15.6837 11.73 13.7616 14.64ZM11.8395 16.755L7.58985 21L5.99811 19.41L7.42467 17.985C5.46227 17.9697 3.58487 17.1829 2.19896 15.795C0.976685 14.5728 0.213692 12.9669 0.0386244 11.2482C-0.136443 9.52953 0.287124 7.80309 1.23791 6.36L2.88972 8.01C1.82355 10.005 2.09385 12.525 3.77569 14.205C4.82683 15.255 6.22336 15.765 7.61989 15.72L5.99811 14.1L7.58985 12.51L11.8395 16.755Z"
            fill="#3C02AA"
          />
        </svg>
      ),
      color: "#3C02AA",
    },
   /*  {
      id: "reports",
      name: "RAPOR",
      path: "#",
      icon: (
        <svg
          width="22"
          height="20"
          viewBox="0 0 22 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19 2H3C2.73478 2 2.48043 2.10536 2.29289 2.29289C2.10536 2.48043 2 2.73478 2 3V17C2 17.2652 2.10536 17.5196 2.29289 17.7071C2.48043 17.8946 2.73478 18 3 18H19C19.2652 18 19.5196 17.8946 19.7071 17.7071C19.8946 17.5196 20 17.2652 20 17V3C20 2.73478 19.8946 2.48043 19.7071 2.29289C19.5196 2.10536 19.2652 2 19 2ZM3 0C2.20435 0 1.44129 0.316071 0.87868 0.87868C0.31607 1.44129 0 2.20435 0 3V17C0 17.7956 0.31607 18.5587 0.87868 19.1213C1.44129 19.6839 2.20435 20 3 20H19C19.7956 20 20.5587 19.6839 21.1213 19.1213C21.6839 18.5587 22 17.7956 22 17V3C22 2.20435 21.6839 1.44129 21.1213 0.87868C20.5587 0.316071 19.7956 0 19 0H3ZM5 5H7V7H5V5ZM10 5C9.73478 5 9.48043 5.10536 9.29289 5.29289C9.10536 5.48043 9 5.73478 9 6C9 6.26522 9.10536 6.51957 9.29289 6.70711C9.48043 6.89464 9.73478 7 10 7H16C16.2652 7 16.5196 6.89464 16.7071 6.70711C16.8946 6.51957 17 6.26522 17 6C17 5.73478 16.8946 5.48043 16.7071 5.29289C16.5196 5.10536 16.2652 5 16 5H10ZM7 9H5V11H7V9ZM9 10C9 9.73478 9.10536 9.48043 9.29289 9.29289C9.48043 9.10536 9.73478 9 10 9H16C16.2652 9 16.5196 9.10536 16.7071 9.29289C16.8946 9.48043 17 9.73478 17 10C17 10.2652 16.8946 10.5196 16.7071 10.7071C16.5196 10.8946 16.2652 11 16 11H10C9.73478 11 9.48043 10.8946 9.29289 10.7071C9.10536 10.5196 9 10.2652 9 10ZM7 13H5V15H7V13ZM9 14C9 13.7348 9.10536 13.4804 9.29289 13.2929C9.48043 13.1054 9.73478 13 10 13H16C16.2652 13 16.5196 13.1054 16.7071 13.2929C16.8946 13.4804 17 13.7348 17 14C17 14.2652 16.8946 14.5196 16.7071 14.7071C16.5196 14.8946 16.2652 15 16 15H10C9.73478 15 9.48043 14.8946 9.29289 14.7071C9.10536 14.5196 9 14.2652 9 14Z"
            fill="#4E0DCC"
          />
        </svg>
      ),
      color: "#4E0DCC",
    }, */

    {
      id: "management",
      name: "YÖNETİM",
      path: "#", // Path will be determined by access control
      icon: (
        <svg
          width="21"
          height="20"
          viewBox="0 0 21 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18.8999 10.6604C18.7396 10.4779 18.6512 10.2433 18.6512 10.0004C18.6512 9.75747 18.7396 9.52287 18.8999 9.34038L20.1799 7.90038C20.3209 7.74305 20.4085 7.54509 20.4301 7.33489C20.4516 7.12469 20.4061 6.91307 20.2999 6.73038L18.2999 3.27038C18.1948 3.0879 18.0348 2.94326 17.8426 2.85707C17.6505 2.77088 17.4361 2.74754 17.2299 2.79038L15.3499 3.17038C15.1107 3.21981 14.8616 3.17997 14.6498 3.05838C14.4379 2.93679 14.2779 2.74187 14.1999 2.51038L13.5899 0.680383C13.5228 0.481762 13.395 0.309248 13.2245 0.187225C13.0541 0.0652023 12.8495 -0.000157766 12.6399 0.000383396H8.6399C8.42183 -0.0109986 8.20603 0.0493098 8.02546 0.172097C7.84489 0.294885 7.70948 0.473403 7.6399 0.680383L7.0799 2.51038C7.0019 2.74187 6.84187 2.93679 6.63001 3.05838C6.41815 3.17997 6.16911 3.21981 5.9299 3.17038L3.9999 2.79038C3.80445 2.76276 3.6052 2.79361 3.42724 2.87902C3.24929 2.96444 3.1006 3.10061 2.9999 3.27038L0.999896 6.73038C0.891056 6.91103 0.842118 7.12147 0.860079 7.33161C0.878039 7.54174 0.961979 7.74082 1.0999 7.90038L2.3699 9.34038C2.53022 9.52287 2.61863 9.75747 2.61863 10.0004C2.61863 10.2433 2.53022 10.4779 2.3699 10.6604L1.0999 12.1004C0.961979 12.2599 0.878039 12.459 0.860079 12.6692C0.842118 12.8793 0.891056 13.0897 0.999896 13.2704L2.9999 16.7304C3.10499 16.9129 3.26502 17.0575 3.45715 17.1437C3.64928 17.2299 3.86372 17.2532 4.0699 17.2104L5.9499 16.8304C6.18911 16.781 6.43815 16.8208 6.65001 16.9424C6.86187 17.064 7.0219 17.2589 7.0999 17.4904L7.7099 19.3204C7.77948 19.5274 7.91489 19.7059 8.09546 19.8287C8.27603 19.9515 8.49183 20.0118 8.7099 20.0004H12.7099C12.9195 20.0009 13.1241 19.9356 13.2945 19.8135C13.465 19.6915 13.5928 19.519 13.6599 19.3204L14.2699 17.4904C14.3479 17.2589 14.5079 17.064 14.7198 16.9424C14.9316 16.8208 15.1807 16.781 15.4199 16.8304L17.2999 17.2104C17.5061 17.2532 17.7205 17.2299 17.9126 17.1437C18.1048 17.0575 18.2648 16.9129 18.3699 16.7304L20.3699 13.2704C20.4761 13.0877 20.5216 12.8761 20.5001 12.6659C20.4785 12.4557 20.3909 12.2577 20.2499 12.1004L18.8999 10.6604ZM17.4099 12.0004L18.2099 12.9004L16.9299 15.1204L15.7499 14.8804C15.0297 14.7332 14.2805 14.8555 13.6445 15.2242C13.0085 15.5929 12.53 16.1822 12.2999 16.8804L11.9199 18.0004H9.3599L8.9999 16.8604C8.76975 16.1622 8.29128 15.5729 7.6553 15.2042C7.01932 14.8355 6.27012 14.7132 5.5499 14.8604L4.3699 15.1004L3.0699 12.8904L3.8699 11.9904C4.36185 11.4404 4.63383 10.7283 4.63383 9.99038C4.63383 9.25245 4.36185 8.54041 3.8699 7.99038L3.0699 7.09038L4.3499 4.89038L5.5299 5.13038C6.25012 5.27761 6.99932 5.15526 7.6353 4.78658C8.27128 4.4179 8.74975 3.82854 8.9799 3.13038L9.3599 2.00038H11.9199L12.2999 3.14038C12.53 3.83854 13.0085 4.4279 13.6445 4.79658C14.2805 5.16526 15.0297 5.28761 15.7499 5.14038L16.9299 4.90038L18.2099 7.12038L17.4099 8.02038C16.9235 8.56914 16.6549 9.27707 16.6549 10.0104C16.6549 10.7437 16.9235 11.4516 17.4099 12.0004ZM10.6399 6.00038C9.84877 6.00038 9.07541 6.23498 8.41761 6.67451C7.75982 7.11403 7.24713 7.73874 6.94438 8.46965C6.64163 9.20055 6.56241 10.0048 6.71675 10.7807C6.8711 11.5567 7.25206 12.2694 7.81147 12.8288C8.37088 13.3882 9.08361 13.7692 9.85954 13.9235C10.6355 14.0779 11.4397 13.9987 12.1706 13.6959C12.9015 13.3932 13.5262 12.8805 13.9658 12.2227C14.4053 11.5649 14.6399 10.7915 14.6399 10.0004C14.6399 8.93952 14.2185 7.9221 13.4683 7.17196C12.7182 6.42181 11.7008 6.00038 10.6399 6.00038ZM10.6399 12.0004C10.2443 12.0004 9.85765 11.8831 9.52876 11.6633C9.19986 11.4436 8.94351 11.1312 8.79214 10.7657C8.64076 10.4003 8.60116 9.99817 8.67833 9.6102C8.7555 9.22224 8.94598 8.86588 9.22568 8.58617C9.50539 8.30647 9.86175 8.11598 10.2497 8.03881C10.6377 7.96164 11.0398 8.00125 11.4053 8.15262C11.7707 8.304 12.0831 8.56034 12.3028 8.88924C12.5226 9.21814 12.6399 9.60482 12.6399 10.0004C12.6399 10.5308 12.4292 11.0395 12.0541 11.4146C11.679 11.7897 11.1703 12.0004 10.6399 12.0004Z"
            fill="#3C02AA"
          />
        </svg>
      ),
      color: "#3C02AA",
    },

  ];

  // İzinlere göre menü filtreleme (admin tümünü görür)
  const menuPermissionMap = {
    dashboard: null,
    appointments: 'appointments',
    tasks: 'tasks',
    contacts: 'contacts',
    cvbank: 'cv',
    requests: 'requests',
    reports: null,
    management: 'management', // Yönetim sekmesi için izin kontrolü
  };

  const menuItems = rawMenuItems.filter(item => {
    const required = menuPermissionMap[item.id];
    if (!required) return true;
    if (user?.role === 'admin' || user?.role === 'başkan' || user?.department === 'BAŞKAN') return true;
    
    // Permissions array formatında geldiği için includes kullanıyoruz
    if (user?.permissions) {
      if (Array.isArray(user.permissions)) {
        return user.permissions.includes(required);
      } else if (typeof user.permissions === 'object') {
        // Object formatında ise (eski format için uyumluluk)
        return Boolean(user.permissions[required]);
      } else if (typeof user.permissions === 'string') {
        // String formatında ise JSON parse et
        try {
          const parsedPermissions = JSON.parse(user.permissions);
          if (Array.isArray(parsedPermissions)) {
            return parsedPermissions.includes(required);
          } else if (typeof parsedPermissions === 'object') {
            return Boolean(parsedPermissions[required]);
          }
        } catch (e) {
          console.warn('Navbar: permissions parse edilemedi:', user.permissions);
          return false;
        }
      }
    }
    return false;
  });

  const handleMenuClick = (menuId, path) => {
    console.log('Navbar menü tıklandı:', { menuId, path }); // Debug log
    setActiveMenu(menuId);
    
    // Yönetim sekmesi için özel işlem
    if (menuId === 'management') {
      // Admin, başkan veya BAŞKAN departmanı ise users sayfasına git
      if (user?.role === 'admin' || user?.role === 'başkan' || user?.department === 'BAŞKAN') {
        navigate('/users');
        return;
      }
      
      // Kullanıcının management izni varsa users sayfasına git
      if (user?.permissions) {
        let hasManagementPermission = false;
        
        if (Array.isArray(user.permissions)) {
          hasManagementPermission = user.permissions.includes('management');
        } else if (typeof user.permissions === 'object') {
          hasManagementPermission = Boolean(user.permissions.management);
        } else if (typeof user.permissions === 'string') {
          try {
            const parsedPermissions = JSON.parse(user.permissions);
            if (Array.isArray(parsedPermissions)) {
              hasManagementPermission = parsedPermissions.includes('management');
            } else if (typeof parsedPermissions === 'object') {
              hasManagementPermission = Boolean(parsedPermissions.management);
            }
          } catch (e) {
            console.warn('Navbar: permissions parse edilemedi:', user.permissions);
          }
        }
        
        if (hasManagementPermission) {
          navigate('/users');
          return;
        }
      }
      
      // İzin yoksa hiçbir şey yapma
      return;
    }
    
    // Diğer menüler için normal işlem
    if (path && path !== "#") {
      console.log('Navigasyon yapılıyor:', path); // Debug log
      navigate(path);
    }
  };

  const handleLogout = () => {
    setShowDropdown(false);
    if (onLogout) {
      onLogout();
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const handleMobileMenuClick = (menuId, path) => {
    setActiveMenu(menuId);
    setShowMobileMenu(false);
    
    // Yönetim sekmesi için özel işlem
    if (menuId === 'management') {
      // Admin, başkan veya BAŞKAN departmanı ise users sayfasına git
      if (user?.role === 'admin' || user?.role === 'başkan' || user?.department === 'BAŞKAN') {
        navigate('/users');
        return;
      }
      
      // Kullanıcının management izni varsa users sayfasına git
      if (user?.permissions) {
        let hasManagementPermission = false;
        
        if (Array.isArray(user.permissions)) {
          hasManagementPermission = user.permissions.includes('management');
        } else if (typeof user.permissions === 'object') {
          hasManagementPermission = Boolean(user.permissions.management);
        } else if (typeof user.permissions === 'string') {
          try {
            const parsedPermissions = JSON.parse(user.permissions);
            if (Array.isArray(parsedPermissions)) {
              hasManagementPermission = parsedPermissions.includes('management');
            } else if (typeof parsedPermissions === 'object') {
              hasManagementPermission = Boolean(parsedPermissions.management);
            }
          } catch (e) {
            console.warn('Navbar: permissions parse edilemedi:', user.permissions);
          }
        }
        
        if (hasManagementPermission) {
          navigate('/users');
          return;
        }
      }
      
      // İzin yoksa hiçbir şey yapma
      return;
    }
    
    // Diğer menüler için normal işlem
    if (path && path !== "#") {
      navigate(path);
    }
  };

  // Update active menu based on current location
  useEffect(() => {
    const currentPath = location.pathname;
    const currentMenuItem = menuItems.find((item) => item.path === currentPath);
    if (currentMenuItem) {
      setActiveMenu(currentMenuItem.id);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Kullanıcı avatar'ını ayarla
    console.log('Navbar user değişti:', user);
    if (user?.avatar) {
      const avatarUrl = getAvatarUrl(user.avatar);
      console.log('Navbar avatar URL set ediliyor:', avatarUrl);
      setUserAvatar(avatarUrl);
    } else {
      console.log('Navbar avatar null set ediliyor');
      setUserAvatar(null);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener("keydown", handleEscapeKey);
    } else {
      // Menü kapandığında body scroll'u normal hale getir
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      // Cleanup: body scroll'u sıfırla
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  // Route değiştiğinde mobil menüyü kapat ve body scroll'u garanti olarak sıfırla
  useEffect(() => {
    // Menü açık kalsa bile route değişiminde kapat
    setShowMobileMenu(false);
    // Body overflow ve olası modal sınıfı temizliği
    document.body.style.overflow = "";
    document.body.classList.remove("modal-open");
  }, [location.pathname]);

  return (
    <>
      {/* Custom Navbar with Bootstrap structure but original design */}
      <div className="navbar">
        <Container fluid className="navbar-container h-100">
          <div className="d-flex align-items-center justify-content-between w-100 h-100">
            {/* Logo Section */}
            <div className="navbar-logo">
              <div className="logo-container">
                <div className="logo-icon">
                  <img
                    className="logo-image"
                    src="/assets/images/logo.png"
                    alt="Logo"
                  />
                </div>
              </div>
            </div>

            {/* Menu Items - Desktop */}
            <div className="navbar-menu">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant="link"
                  className={`menu-item p-0 border-0 ${
                    activeMenu === item.id ? "active" : ""
                  } ${item.isActive ? "highlighted" : ""}`}
                  onClick={() => handleMenuClick(item.id, item.path)}
                >
                  <div className="menu-icon" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <span className="menu-text">{item.name}</span>
                </Button>
              ))}
            </div>

            {/* User Section */}
            <div className="navbar-user">
              <div className="user-info">
                <span className="user-name">{user?.name || "ÖMER GÖK"}</span>
              </div>

              {/* Notification Dropdown */}
              <NotificationDropdown />

              {/* User Avatar Dropdown */}
              <NavDropdown
                title={
                  <div className="user-avatar-simple">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt="User Avatar"
                        className="avatar-img"
                      />
                    ) : (
                      <div className="avatar-placeholder-simple">
                        👤
                      </div>
                    )}
                  </div>
                }
                id="user-dropdown"
                align="end"
                className="user-dropdown-toggle"
              >
                <NavDropdown.Item 
                  onClick={() => navigate('/profile')} 
                  className="dropdown-item"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
                      fill="#5C6576"
                    />
                  </svg>
                  <span>Profil</span>
                </NavDropdown.Item>
                
                {/* Activities Link - Sadece Admin Kullanıcılar İçin */}
                {(user?.role === 'admin' || user?.role === 'başkan' || user?.department === 'BAŞKAN') && (
                  <NavDropdown.Item 
                    onClick={() => navigate('/activities')} 
                    className="dropdown-item"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C11.31 2 14 4.69 14 8C14 11.31 11.31 14 8 14ZM8.5 4H7V9L11.25 11.52L12 10.25L8.5 8.17V4Z"
                        fill="#5C6576"
                      />
                    </svg>
                    <span>Aktiviteler</span>
                  </NavDropdown.Item>
                )}
                
             
                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={handleLogout}
                  className="dropdown-item logout-item"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M7 12L3 8M3 8L7 4M3 8H13M13 2H14C14.5523 2 15 2.44772 15 3V13C15 13.5523 14.5523 14 14 14H13"
                      stroke="#E74C3C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Çıkış Yap</span>
                </NavDropdown.Item>
              </NavDropdown>

              {/* Mobile Menu Toggle */}
              <Button
                variant="link"
                className="mobile-menu-toggle p-0 border-0 d-lg-none ms-2"
                onClick={toggleMobileMenu}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 12h18M3 6h18M3 18h18"
                    stroke="#5C6576"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile Menu Offcanvas */}
      <Offcanvas
        show={showMobileMenu}
        onHide={closeMobileMenu}
        placement="start"
        backdrop={false}
        scroll={true}
        className="mobile-menu"
      >
        <Offcanvas.Header closeButton className="mobile-menu-header">
          <Offcanvas.Title>
            <div className="mobile-header-user">
              <div className="user-avatar-simple">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="User Avatar"
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-placeholder-simple">👤</div>
                )}
              </div>
              <span className="user-name">{user?.name}</span>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="mobile-menu-body">
          <div className="mobile-menu-items">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="link"
                className={`mobile-menu-item p-0 border-0 w-100 ${
                  activeMenu === item.id ? "active" : ""
                }`}
                onClick={() => handleMobileMenuClick(item.id, item.path)}
              >
                <div className="menu-icon" style={{ color: item.color }}>
                  {item.icon}
                </div>
                <span className="menu-text">{item.name}</span>
              </Button>
            ))}
          </div>

          <div className="mobile-menu-user">
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
            </div>
            <Button
              variant="link"
              className="mobile-profile-btn p-0 border-0 w-100 mt-2"
              onClick={() => {
                navigate('/profile');
                setShowMobileMenu(false);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
                  fill="#5C6576"
                />
              </svg>
              <span>Profil</span>
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Navbar;
