import { Chapter, ChapterTypeEnum } from "mangadex-client";

const fixture: Chapter = {
  id: "a05de006-df86-4fe1-9d20-32664a78c1cc",
  type: ChapterTypeEnum.Chapter,
  attributes: {
    title: "Chapter title",
    volume: "1",
    chapter: "15.1",
    translatedLanguage: "en",
    data: [
      "x1-b765e86d5ecbc932cf3f517a8604f6ac6d8a7f379b0277a117dc7c09c53d041e.png",
      "x2-fc7c198880083b053bf4e8aebfc0eec1adbe52878a6c5ff08d25544a1d5502ef.png",
      "x3-90f15bc8b91deb0dc88473b532e42a99f93ee9e2c8073795c81b01fff428af80.png",
    ],
    dataSaver: [
      "x1-ab2b7c8f30c843aa3a53c29bc8c0e204fba4ab3e75985d761921eb6a52ff6159.jpg",
      "x2-3e057d937e01696adce2ac2865f62f6f6a15f03cef43d929b88e99a4b8482e03.jpg",
      "x3-128742088f99806b022bbc8006554456f2a20d0d176d7f3264a65ff9a549d0dd.jpg",
    ],
    version: 1,
    publishAt: "2021-06-08T00:00:00Z",
  },
};

export default fixture;
