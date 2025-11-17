"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import favicon from "@/app/favicon.png";
import {
  DashboardIcon,
  SurveysIcon,
  UsersIcon,
  ResultsIcon,
  LogoutIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "./icons";
import "./sidebar.css";

const menuItems = [
  { name: "Dashboard", icon: DashboardIcon, href: "/" },
  {
    name: "Surveys",
    icon: SurveysIcon,
    href: "/surveys",
    subItems: [
      { name: "Categories", href: "/surveys/categories" },
      { name: "Subcategories", href: "/surveys/subcategories" },
    ],
  },
  { name: "Users", icon: UsersIcon, href: "/users" },
  { name: "Results", icon: ResultsIcon, href: "/results" },
];

export function Sidebar() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMinimized(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsMinimized(!isMinimized);
  };

  const handleMouseEnter = () => {
    if (isMinimized) {
      setIsHoverOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHoverOpen(false);
  };

  const showText = !isMinimized || isHoverOpen;
  const isSurveysPage = pathname.startsWith("/surveys");

  return (
    <aside
      className={`my-sidebar ${
        isMinimized && !isHoverOpen ? "minimized" : "maximized"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="my-sidebar-header">
        {showText && (
          <div className="my-sidebar-logo-container">
            <img src={favicon.src} alt="Dovec Logo" className="my-sidebar-logo" />  {/* Logo image */}
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="my-sidebar-toggle-button"
        >
          {isMinimized && !isHoverOpen ? (
            <ArrowRightIcon className="my-sidebar-icon" />
          ) : (
            <ArrowLeftIcon className="my-sidebar-icon" />
          )}
        </button>
      </div>

      <nav className="my-sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name} className="my-sidebar-nav-item">
              <Link
                href={item.href}
                className={`my-sidebar-nav-link ${
                  pathname === item.href ? "active" : ""
                }`}
              >
                <item.icon className="my-sidebar-nav-icon" />
                {showText && <span>{item.name}</span>}
              </Link>
              {item.subItems && isSurveysPage && showText && (
                <ul className="my-sidebar-sub-nav">
                  {item.subItems.map((subItem) => (
                    <li key={subItem.name} className="my-sidebar-sub-nav-item">
                      <Link
                        href={subItem.href}
                        className={`my-sidebar-sub-nav-link ${
                          pathname === subItem.href ? "active" : ""
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="my-sidebar-footer">
        <Link href="#" className="my-sidebar-logout-link">
          <LogoutIcon className="my-sidebar-logout-icon" />
          {showText && <span>Logout</span>}
        </Link>
      </div>
    </aside>
  );
}
