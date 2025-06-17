import { useEffect, useState } from "react";
import { LrInputs } from "@/types"; // assuming this is defined
import { filterLRDetailsApi } from "@/api/shipment";

export const useFilteredLRs = (search: string, isAdmin: boolean, branchId: string) => {
  const [lrData, setLRData] = useState<LrInputs[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!search?.trim()) {
      setLRData([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await filterLRDetailsApi(search.trim());

        if (response?.status === 200) {
          const allLRs: LrInputs[] = response.data.data;
          const filtered = isAdmin
            ? allLRs
            : allLRs.filter((lr) => lr.branchId === branchId);

          setLRData(filtered);
        } else {
          setLRData([]);
          setError("No results found.");
        }
      } catch (err) {
        setError("Failed to fetch LR details.");
        setLRData([]);
        console.error("Filter error:", err);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [search, isAdmin, branchId]);

  return { lrData, loading, error };
};
