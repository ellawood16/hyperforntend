import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCopyHistory } from "@/api/copyTrade";

export function useCopyHistory(enabled = true) {
  const client = useQueryClient();
  const history = useQuery({ queryKey: ["copy-history"], queryFn: getCopyHistory, enabled, refetchInterval: 5000 });
  const settled = history.data?.filter(copy => copy.settled_at).length ?? 0;
  useEffect(() => {
    if (settled) {
      void client.invalidateQueries({queryKey: ["wallet"]});
      void client.invalidateQueries({queryKey: ["transactions"]});
    }
  }, [settled, client]);
  return history;
}
