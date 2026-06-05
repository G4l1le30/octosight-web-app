import React from "react";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders children text", () => {
    render(React.createElement(Button, null, "Click me"));
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies primary variant by default", () => {
    render(React.createElement(Button, null, "Primary"));
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-primary");
  });

  it("shows spinner when loading", () => {
    render(React.createElement(Button, { loading: true }, "Loading"));
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });
});
