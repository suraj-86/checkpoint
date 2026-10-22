import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { KnowledgeTree } from "../components/KnowledgeTree";

export function GardenPage() {
  return (
    <div className="grid gap-4">
      <Link to="/progress" className="btn-secondary w-fit">
        <ArrowLeft size={15} />
        Back to progress
      </Link>
      <KnowledgeTree />
    </div>
  );
}
