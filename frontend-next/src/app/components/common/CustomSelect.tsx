"use client";

import { useEffect, useRef } from "react";

interface CustomSelectProps {
  options: string[];
  value: string;
  placeholder: string;
  isOpen: boolean;
  onChange: (option: string) => void;
  onToggle: () => void;
  onClose: () => void;
}

export default function CustomSelect({
  options,
  value,
  placeholder,
  isOpen,
  onChange,
  onToggle,
  onClose,
}: CustomSelectProps) {
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [isOpen, onClose]);

  const handleOptionClick = (option: string) => {
    onChange(option);
    onClose();
  };

  return (
    <div ref={selectRef} className="custom-select">
      <button
        type="button"
        className="custom-select__trigger"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{value || placeholder}</span>
      </button>

      {isOpen && (
        <div
          className="custom-select__menu"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={`custom-select__option ${
                option === value ? "is-selected" : ""
              }`}
              onClick={() => handleOptionClick(option)}
              role="option"
              aria-selected={option === value}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}