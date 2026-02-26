/**
 * Binary search to find the last timeline frame whose `t` <= currentTime.
 * O(log n)
 */
export function findSliceIndex(timeline: { t: number }[], currentTime: number): number {
    if (!timeline.length) return 0;

    let lo = 0;
    let hi = timeline.length - 1;

    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1; // upper mid to avoid infinite loop
        if (timeline[mid].t <= currentTime) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }

    return lo;
}
