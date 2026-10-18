import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getActiveSession } from "../api/practiceApi";

export function ActiveSessionRedirect() {
  const navigate = useNavigate();
  const { data, isError } = useQuery({ queryKey: ["active-session"], queryFn: getActiveSession, retry: false });

  useEffect(() => {
    if (data) navigate(`/practice/session/${data.sessionId}`, { replace: true });
    if (isError) navigate("/home", { replace: true });
  }, [data, isError, navigate]);

  return <p className="text-slate-500">Finding your session...</p>;
}
