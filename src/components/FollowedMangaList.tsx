import axios from "axios";
import { useQuery } from "react-query";

interface MangadexFollowedMangaList {
  id: string;
}

interface Props {
  authToken: string;
}

// TODO finish implementation
export function FollowedMangaList({ authToken }: Props) {
  const { data } = useQuery("followed-manga-list", () => {
    return axios.get<MangadexFollowedMangaList>(
      "https://api.mangadex.org/user/follows/manga/feed",
      {
        headers: {
          Authorization: `bearer ${authToken}`,
        },
      }
    );
  });

  return (
    <>
      <h1 data-cy="followed-manga-header">Followed Manga</h1>
      <div>{JSON.stringify(data)}</div>
    </>
  );
}
