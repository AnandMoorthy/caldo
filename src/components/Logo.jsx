import React from "react";

export default function Logo({ className = "h-8 w-8" }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}icons/logo.svg`}
      alt=""
      width={32}
      height={32}
      draggable={false}
      className={`${className} shrink-0`}
    />
  );
}
