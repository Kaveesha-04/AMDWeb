# AMD Labs website

The official website of AMD Labs and AMD24, our Adaptable and Modular Drone. It tells the story of how a first-year team built a low-budget drone from scratch, including its flight controller, and shares a step-by-step build tutorial, a teaching guide and the challenges we faced. We are showing it at FITExpo 2026.

The site is plain HTML, CSS and JavaScript with no build step.

**Live site:** <https://kaveesha-04.github.io/AMDWeb/> (once GitHub Pages is turned on)

**Drone source code:** <https://github.com/Kaveesha-04/UAV>

## What's inside

| Page | Contents |
|---|---|
| Home | Vision, mission, our story, 3D model and FITExpo 2026 |
| Our Story | Timeline from first-year project to AMD Labs, and the team |
| The Drone | System diagram, 3D model, motor mixing, flight modes and safety |
| Build It | 13-stage build tutorial with progress checklists |
| Learn | 9-lesson teaching guide with quizzes and a PID simulator |
| Challenges | 13 problems we faced and what we learned |
| Resources | Wiring, schematics, costs, checklists and a glossary |
| Roadmap | Planned upgrades |
| Contact | Team LinkedIn profiles and photos |

## Turn on GitHub Pages

1. In this repository, go to **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose branch **main**, folder **/ (root)**, and select **Save**.
4. After a minute or two, the site appears at the live address above.

## Before you publish

- Confirm that team members and supervisors are happy to be named in `story.html` and `contact.html`, and to appear in the photos.
- Search the site for "To be confirmed by team" and fill in what you can.

## Edit the site

- Page text is in the `.html` files. Open one in a text editor, change the words and commit it.
- The shared header, menu and footer are repeated in each page, so change them on every page.
- Colours are at the top of `assets/css/style.css`.
- The search list is in `assets/js/search-index.js`. It does not update on its own when you change page text.

## Preview on your computer

Double-click `index.html`. Everything works without a server, including the 3D model.

## How the 3D viewer is packaged

- `assets/js/model-data.js` holds the 3D model, and `assets/js/drone3d.bundle.js` holds the viewer and three.js.
- `assets/js/drone3d.source.js` is the readable viewer code, kept for reference. The site does not load it, so changes to it need rebundling with a tool such as esbuild.

## License

The website's code and text are under the [MIT License](LICENSE). The AMD Labs name and logo, the team photos and other project images are not licensed for reuse. See [NOTICE](NOTICE).

Third-party parts keep their own licences:

- [three.js](https://threejs.org), MIT License: `assets/licenses/three-js-LICENSE.txt`
- [Fira Sans](https://mozilla.github.io/Fira/), SIL Open Font License: `assets/licenses/fira-sans-OFL.txt`
