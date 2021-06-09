const getUserFollowsMangaFeedSpy = jest.fn();

export const chapterApi = () => ({
  getUserFollowsMangaFeed: getUserFollowsMangaFeedSpy,
});
