/**
 * ConnectionQualityIndicator Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ConnectionQualityIndicator,
  getQualityFromLatency,
} from "./ConnectionQualityIndicator";

describe("ConnectionQualityIndicator", () => {
  describe("Quality Level Helper Function", () => {
    it("returns excellent for latency < 50ms", () => {
      expect(getQualityFromLatency(0)).toBe("excellent");
      expect(getQualityFromLatency(25)).toBe("excellent");
      expect(getQualityFromLatency(49)).toBe("excellent");
    });

    it("returns good for latency 50-99ms", () => {
      expect(getQualityFromLatency(50)).toBe("good");
      expect(getQualityFromLatency(75)).toBe("good");
      expect(getQualityFromLatency(99)).toBe("good");
    });

    it("returns fair for latency 100-199ms", () => {
      expect(getQualityFromLatency(100)).toBe("fair");
      expect(getQualityFromLatency(150)).toBe("fair");
      expect(getQualityFromLatency(199)).toBe("fair");
    });

    it("returns poor for latency >= 200ms", () => {
      expect(getQualityFromLatency(200)).toBe("poor");
      expect(getQualityFromLatency(500)).toBe("poor");
      expect(getQualityFromLatency(1000)).toBe("poor");
    });

    it("returns poor for undefined latency", () => {
      expect(getQualityFromLatency(undefined)).toBe("poor");
      expect(getQualityFromLatency(null as any)).toBe("poor");
    });
  });

  describe("Component Rendering", () => {
    it("renders with excellent quality level", () => {
      render(
        <ConnectionQualityIndicator qualityLevel="excellent" latency={25} />,
      );
      expect(screen.getByText("Excellent")).toBeInTheDocument();
      expect(screen.getByText("📡")).toBeInTheDocument();
    });

    it("renders with good quality level", () => {
      render(<ConnectionQualityIndicator qualityLevel="good" latency={75} />);
      expect(screen.getByText("Good")).toBeInTheDocument();
      expect(screen.getByText("📶")).toBeInTheDocument();
    });

    it("renders with fair quality level", () => {
      render(<ConnectionQualityIndicator qualityLevel="fair" latency={150} />);
      expect(screen.getByText("Fair")).toBeInTheDocument();
      expect(screen.getByText("📳")).toBeInTheDocument();
    });

    it("renders with poor quality level", () => {
      render(<ConnectionQualityIndicator qualityLevel="poor" latency={500} />);
      expect(screen.getByText("Poor")).toBeInTheDocument();
      expect(screen.getByText("❌")).toBeInTheDocument();
    });
  });

  describe("Latency Display", () => {
    it("shows latency when showLatency is true", () => {
      render(
        <ConnectionQualityIndicator
          qualityLevel="good"
          latency={75}
          showLatency={true}
        />,
      );
      expect(screen.getByText("75ms")).toBeInTheDocument();
    });

    it("hides latency when showLatency is false", () => {
      render(
        <ConnectionQualityIndicator
          qualityLevel="good"
          latency={75}
          showLatency={false}
        />,
      );
      expect(screen.queryByText("75ms")).not.toBeInTheDocument();
    });

    it("does not show latency when undefined", () => {
      render(
        <ConnectionQualityIndicator qualityLevel="good" showLatency={true} />,
      );
      expect(screen.queryByText(/ms/)).not.toBeInTheDocument();
    });
  });

  describe("CSS Classes", () => {
    it("applies quality-excellent class", () => {
      const { container } = render(
        <ConnectionQualityIndicator qualityLevel="excellent" />,
      );
      const indicator = container.querySelector(
        ".connection-quality-indicator",
      );
      expect(indicator).toHaveClass("quality-excellent");
    });

    it("applies quality-good class", () => {
      const { container } = render(
        <ConnectionQualityIndicator qualityLevel="good" />,
      );
      const indicator = container.querySelector(
        ".connection-quality-indicator",
      );
      expect(indicator).toHaveClass("quality-good");
    });

    it("applies quality-fair class", () => {
      const { container } = render(
        <ConnectionQualityIndicator qualityLevel="fair" />,
      );
      const indicator = container.querySelector(
        ".connection-quality-indicator",
      );
      expect(indicator).toHaveClass("quality-fair");
    });

    it("applies quality-poor class", () => {
      const { container } = render(
        <ConnectionQualityIndicator qualityLevel="poor" />,
      );
      const indicator = container.querySelector(
        ".connection-quality-indicator",
      );
      expect(indicator).toHaveClass("quality-poor");
    });

    it("applies custom className", () => {
      const { container } = render(
        <ConnectionQualityIndicator
          qualityLevel="good"
          className="custom-class"
        />,
      );
      const indicator = container.querySelector(
        ".connection-quality-indicator",
      );
      expect(indicator).toHaveClass("custom-class");
    });
  });

  describe("Accessibility", () => {
    it("has status role", () => {
      render(
        <ConnectionQualityIndicator qualityLevel="excellent" latency={25} />,
      );
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("has descriptive aria-label with quality level", () => {
      render(<ConnectionQualityIndicator qualityLevel="good" latency={75} />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute(
        "aria-label",
        "Connection quality: Good (75ms latency)",
      );
    });

    it("has descriptive aria-label without latency", () => {
      render(<ConnectionQualityIndicator qualityLevel="fair" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute(
        "aria-label",
        "Connection quality: Fair",
      );
    });

    it("has title attribute with quality info", () => {
      render(<ConnectionQualityIndicator qualityLevel="poor" latency={500} />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute(
        "title",
        "Connection quality: Poor (500ms)",
      );
    });
  });

  describe("Quality Level Derivation", () => {
    it("derives excellent from low latency", () => {
      render(<ConnectionQualityIndicator latency={30} />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("quality-excellent");
      expect(screen.getByText("Excellent")).toBeInTheDocument();
    });

    it("derives good from medium latency", () => {
      render(<ConnectionQualityIndicator latency={85} />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("quality-good");
      expect(screen.getByText("Good")).toBeInTheDocument();
    });

    it("derives fair from high latency", () => {
      render(<ConnectionQualityIndicator latency={150} />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("quality-fair");
      expect(screen.getByText("Fair")).toBeInTheDocument();
    });

    it("derives poor from very high latency", () => {
      render(<ConnectionQualityIndicator latency={300} />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("quality-poor");
      expect(screen.getByText("Poor")).toBeInTheDocument();
    });
  });

  describe("Boundary Values", () => {
    it("handles 50ms boundary (excellent to good)", () => {
      const { rerender } = render(<ConnectionQualityIndicator latency={49} />);
      expect(screen.getByRole("status")).toHaveClass("quality-excellent");

      rerender(<ConnectionQualityIndicator latency={50} />);
      expect(screen.getByRole("status")).toHaveClass("quality-good");
    });

    it("handles 100ms boundary (good to fair)", () => {
      const { rerender } = render(<ConnectionQualityIndicator latency={99} />);
      expect(screen.getByRole("status")).toHaveClass("quality-good");

      rerender(<ConnectionQualityIndicator latency={100} />);
      expect(screen.getByRole("status")).toHaveClass("quality-fair");
    });

    it("handles 200ms boundary (fair to poor)", () => {
      const { rerender } = render(<ConnectionQualityIndicator latency={199} />);
      expect(screen.getByRole("status")).toHaveClass("quality-fair");

      rerender(<ConnectionQualityIndicator latency={200} />);
      expect(screen.getByRole("status")).toHaveClass("quality-poor");
    });
  });
});
