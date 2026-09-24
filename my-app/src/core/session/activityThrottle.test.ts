import { describe, expect, it } from "vitest";
import ActivityThrottle from "./activityThrottle";

describe("ActivityThrottle", () => {
  const setup = (interval = 1000) => {
    let time = 10_000;
    return { throttle: new ActivityThrottle(interval, () => time), advance: (ms: number) => { time += ms; } };
  };

  it("does not fire right after it is created, since the page has just talked to the server", () => {
    const { throttle } = setup();
    expect(throttle.tryRun()).toBe(false);
  });

  it("fires once the interval has passed, then waits a full interval again", () => {
    const { throttle, advance } = setup();
    advance(999);
    expect(throttle.tryRun()).toBe(false);
    advance(1);
    expect(throttle.tryRun()).toBe(true);
    advance(500);
    expect(throttle.tryRun()).toBe(false);
    advance(500);
    expect(throttle.tryRun()).toBe(true);
  });

  it("fires only once for a burst of activity", () => {
    const { throttle, advance } = setup();
    advance(5000);
    const fired = Array.from({ length: 20 }, () => throttle.tryRun()).filter(Boolean);
    expect(fired).toHaveLength(1);
  });
});
