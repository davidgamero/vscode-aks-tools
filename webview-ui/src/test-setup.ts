import "@testing-library/jest-dom/vitest";

// jsdom implements neither of these, and SearchableDropdown calls both: scrollIntoView when
// moving the keyboard highlight, and getBoundingClientRect when deciding whether to drop up.
Element.prototype.scrollIntoView = () => {};
