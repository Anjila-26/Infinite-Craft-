"use client";

import { Element } from "@/types";

interface ElementItemProps {
  element: Element;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, element: Element) => void;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  isFirstDiscovery?: boolean;
}

export default function ElementItem({
  element,
  onDragStart,
  onClick,
  className = "",
  style,
  isFirstDiscovery = false,
}: ElementItemProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("element", JSON.stringify(element));
    e.dataTransfer.effectAllowed = "copy";
    if (onDragStart) {
      onDragStart(e, element);
    }
  };

  return (
    <div
      className={`element ${isFirstDiscovery ? "first-discovery" : ""} ${className}`}
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      style={style}
    >
      <span className="text-base">{element.emoji}</span>
      <span>{element.name}</span>
    </div>
  );
}

