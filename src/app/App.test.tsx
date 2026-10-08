import { render, screen } from "@testing-library/react";

import { App } from "./App";

describe("App", () => {
  it("renders the Daydreamin brand, decade navigation landmark, and player landmark", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Daydreamin'" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Decade navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Music player" }),
    ).toBeInTheDocument();
  });
});
