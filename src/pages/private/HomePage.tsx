import { useAuthContext } from "../../hooks/useAuthContext";
import { FollowedMangaList } from "../../components/FollowedMangaList";

export function HomePage() {
  const { sessionToken } = useAuthContext();
  return (
    <>
      <h1>Welcome!</h1>
      <FollowedMangaList authToken={sessionToken} />
    </>
  );
}
