'use strict';
/* =============================================================
   OUR LITTLE BOOK OF MEMORIES — Chapter Manifest
   
   chapterNum    : display number shown in the page counter (1–16)
   image         : relative path to the chapter image
   subPage       : (optional) position within a multi-page chapter
   totalSubPages : (optional) total pages in that chapter
   
   The app generates all chapter pages automatically from this
   array. Never hardcode chapter pages in the HTML.
   ============================================================= */

const chapters = [
  { chapterNum:  1, image: "images/chapters/chapter01.png" },
  { chapterNum:  2, image: "images/chapters/chapter02.png" },
  { chapterNum:  3, image: "images/chapters/chapter03.png" },
  { chapterNum:  4, image: "images/chapters/chapter04.png" },
  { chapterNum:  5, image: "images/chapters/chapter05.png" },
  { chapterNum:  6, image: "images/chapters/chapter06.jpg" },
  { chapterNum:  7, image: "images/chapters/chapter07.png" },
  { chapterNum:  8, image: "images/chapters/chapter08.png" },
  { chapterNum:  9, image: "images/chapters/chapter09.png" },
  { chapterNum: 10, image: "images/chapters/chapter10.png" },
  { chapterNum: 11, image: "images/chapters/chapter11.png" },
  { chapterNum: 12, image: "images/chapters/chapter12.png" },
  { chapterNum: 13, image: "images/chapters/chapter13.png" },
  { chapterNum: 14, image: "images/chapters/chapter14A.png", subPage: 1, totalSubPages: 4 },
  { chapterNum: 14, image: "images/chapters/chapter14B.png", subPage: 2, totalSubPages: 4 },
  { chapterNum: 14, image: "images/chapters/chapter14C.png", subPage: 3, totalSubPages: 4 },
  { chapterNum: 14, image: "images/chapters/chapter14D.png", subPage: 4, totalSubPages: 4 },
  { chapterNum: 15, image: "images/chapters/chapter15.png" },
  { chapterNum: 16, image: "images/chapters/chapter16.jpg" },
];
