import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CategoryPieChart from "./CategoryPieChart";

vi.mock("../contexts/UserSettingsContext", () => ({
  useUserSettings: () => ({
    formatCurrency: (value: number) => `₱${value.toFixed(2)}`
  })
}));

describe("CategoryPieChart", () => {
  it("uses distinct colors and narrow gaps without divider overlays", () => {
    const { container } = render(
      <CategoryPieChart
        segments={[
          { label: "Foods", percentage: 44, value: 44 },
          { label: "Pets", percentage: 7, value: 7 },
          { label: "Self care", percentage: 32, value: 32 },
          { label: "Entertainment", percentage: 3, value: 3 },
          { label: "Travel", percentage: 8, value: 8 },
          { label: "Car", percentage: 6, value: 6 }
        ]}
      />
    );
    const sliceCircles = Array.from(container.querySelectorAll("svg circle")).slice(1);
    const colors = sliceCircles.map((circle) => circle.getAttribute("stroke"));

    expect(sliceCircles).toHaveLength(6);
    expect(new Set(colors).size).toBe(6);
    expect(sliceCircles.every((circle) => circle.getAttribute("stroke-linecap") === "butt")).toBe(
      true
    );
    expect(sliceCircles[0]).toHaveAttribute("stroke-dasharray", "43.55 100");
    expect(container.querySelector("svg line")).not.toBeInTheDocument();
  });

  it("orders the legend and top category from highest to lowest value", () => {
    const { container } = render(
      <CategoryPieChart
        segments={[
          { label: "Travel", percentage: 20, value: 200 },
          { label: "Food", percentage: 50, value: 500 },
          { label: "Books", percentage: 30, value: 300 }
        ]}
      />
    );

    const legendLabels = Array.from(container.querySelectorAll('[role="listitem"]')).map(
      (item) => item.textContent
    );

    expect(legendLabels).toEqual(["Food50%₱500.00", "Books30%₱300.00", "Travel20%₱200.00"]);
    expect(container.querySelector('[role="img"]')).toHaveTextContent("TopFood");
  });
});
