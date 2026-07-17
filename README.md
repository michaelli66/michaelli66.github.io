# michaelli66.github.io

My personal site — a writing/tinkering **home base**. Notes, experiments, and
research, live at **https://michaelli66.github.io/**.

Built with [Jekyll](https://jekyllrb.com/) and served by GitHub Pages. The
homepage is a reverse-chronological feed of posts; publications live on a
quieter `/research/` page.

## Add a post

Posting is the whole point, and it's just one Markdown file. Create
`_posts/YYYY-MM-DD-a-short-slug.md`:

```markdown
---
layout: post
kind: writing        # writing · experiment · note  → sets the feed icon + label
title: "Your title"
summary: "One line shown in the feed and used for the page description."
# link: /some/demo.html        # optional: adds an "Open it →" button (for experiments)
# link_label: "Play it →"      # optional: custom button text
---

Write here in plain Markdown.
```

Commit and push to `main` — GitHub Pages rebuilds automatically and the post
appears in the feed. No local build step required.

The three `kind`s just change the little icon and label in the feed:

| `kind`       | icon | for                                  |
|--------------|------|--------------------------------------|
| `writing`    | ✍️   | essays, reflections                  |
| `experiment` | 🎯   | demos, playable things, code toys    |
| `note`       | 🧠   | short thoughts, work-in-progress     |

## Structure

```
_config.yml            site settings (title, links, build)
index.html             homepage feed
research.md            publications (/research/)
_layouts/
  default.html         shared shell: header, footer, <head>
  post.html            blog post reading view
  page.html            generic page
_posts/                blog posts (Markdown)
assets/
  css/style.css        the "Companion" theme (warm; light + dark)
  img/husky.jpg        avatar
tracking_game/         the Tracking Game experiment (canvas)
```

## Editing the look

All colors, type, and spacing live in `assets/css/style.css`, driven by CSS
custom properties at the top (`--bg`, `--plum`, `--peach`, …). Light and dark
themes are defined there; dark follows the visitor's system preference.

## Running it locally (optional)

GitHub Pages builds the site for you, so this is only needed to preview before
pushing. It requires Ruby ≥ 3.0 (the stock macOS Ruby is too old):

```bash
gem install bundler jekyll
bundle exec jekyll serve      # then open http://localhost:4000
```
