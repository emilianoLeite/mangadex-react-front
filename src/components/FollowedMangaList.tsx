import { useQuery } from "react-query";
import { followedMangaList } from "../lib/mangadex/client";

// TODO finish implementation
export function FollowedMangaList() {
  const { data, error, isError, isLoading } = useQuery(
    "followed-manga-list",
    followedMangaList
  );
  let content;

  if (isLoading) {
    content = <p> Loading ... </p>;
  } else if (isError) {
    console.error(error);

    content = (
      <>
        <p>Failed to load Followed Mangas.</p>
        <p>{JSON.stringify(error)}</p>
        <p>Please reload the page to try again</p>
      </>
    );
  } else {
    content = <div>{JSON.stringify(data)}</div>;
  }
  return (
    <>
      <h1 data-cy="followed-manga-header">Followed Manga</h1>
      {content}
    </>
  );
}
