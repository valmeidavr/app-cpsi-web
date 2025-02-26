"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-sm shadow-md">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={item.label} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            )}

            {isLast ? (
              <span className="text-gray-900 font-semibold">{item.label}</span>
            ) : (
              <Link
                href={item.href || "#"}
                className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
