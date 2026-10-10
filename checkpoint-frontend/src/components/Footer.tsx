import { Github, Linkedin, Mail } from "lucide-react";

const GITHUB_URL = "https://github.com/suraj-86";
const LINKEDIN_URL = "https://www.linkedin.com/in/suraj-k-6a2b60227/";
const EMAIL = "harshsuraj8676@gmail.com";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent("Checkpoint: request for a new topic")}`;

const linkClass =
  "flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-indigo-600";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-white/60 bg-white/50 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 py-6 text-center">
        <p className="text-sm font-semibold text-slate-800">&copy; {new Date().getFullYear()} Suraj</p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Github size={16} />
            GitHub
          </a>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Linkedin size={16} />
            LinkedIn
          </a>
          <a href={MAILTO} className={linkClass}>
            <Mail size={16} />
            {EMAIL}
          </a>
        </div>

        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-500">
          Want to practice a topic that is not here yet, like general interview preparation? Get in touch with me
          and I will add a few hundred questions on it so you can practice.
        </p>
      </div>
    </footer>
  );
}
