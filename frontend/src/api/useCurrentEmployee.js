import { useEffect, useState } from "react";
import { get } from "./apiService";

// Small shared hook so any page/layout can know who is logged in and
// their role, without re-fetching it in more than one place.
export function useCurrentEmployee() {
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    get("/profile/me").then(setEmployee).catch(() => setEmployee(null));
  }, []);

  return employee;
}
