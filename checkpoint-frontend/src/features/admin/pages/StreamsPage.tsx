import * as api from "../api/catalogApi";
import { GroupPage } from "../components/GroupPage";
import type { Catalog } from "../types/catalog.types";

const pickStreams = (c: Catalog) => c.streams;

export function StreamsPage() {
  return (
    <GroupPage
      kind="stream"
      title="Streams"
      singular="Stream"
      placeholder="Computer Science"
      intro="A stream is a broad field such as Computer Science or Commerce. It groups subjects, and a subject can sit in several streams."
      pick={pickStreams}
      create={api.createStream}
      update={api.updateStream}
      remove={api.deleteStream}
      setSubjects={api.setStreamSubjects}
    />
  );
}
