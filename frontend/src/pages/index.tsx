import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionHeading } from "@/components/ui/section-heading";

export default function Home() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const showcaseRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const featuresSectionRef = useRef<HTMLElement | null>(null);
  const showcaseSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cleanupFns: Array<() => void> = [];
    const viewportH = () => window.innerHeight || document.documentElement.clientHeight || 0;
    // Eased progress state for sections
    let heroProg = 0;
    let featuresProg = 0;
    let showcaseProg = 0;

    const getProgress = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const vh = viewportH();
      const start = vh * 0.15; // start animating slightly after entering
      const end = vh * 0.85; // finish before leaving
      const p = (end - (rect.top - start)) / (end - start);
      return Math.min(1, Math.max(0, p));
    };

    // Simple easing towards target (lerp)
    const easeTowards = (current: number, target: number, ease: number) => current + (target - current) * ease;

    (async () => {
      const THREE = await import("three");

      const initScene = (
        container: HTMLDivElement,
        getSize: () => { width: number; height: number },
        build: (params: {
          THREE: typeof import("three");
          scene: import("three").Scene;
          camera: import("three").PerspectiveCamera;
          renderer: import("three").WebGLRenderer;
        }) => { animate?: (time: number) => void; dispose?: () => void }
      ) => {
        const { width, height } = getSize();
        const scene = new THREE.Scene();
        scene.background = null;

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 3;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        const { animate, dispose } = build({ THREE, scene, camera, renderer });

        let raf = 0;
        const onResize = () => {
          const size = getSize();
          renderer.setSize(size.width, size.height);
          camera.aspect = size.width / size.height;
          camera.updateProjectionMatrix();
        };

        const loop = (t: number) => {
          raf = requestAnimationFrame(loop);
          // Update eased progress each frame
          if (heroSectionRef.current) heroProg = easeTowards(heroProg, getProgress(heroSectionRef.current), 0.08);
          if (featuresSectionRef.current) featuresProg = easeTowards(featuresProg, getProgress(featuresSectionRef.current), 0.08);
          if (showcaseSectionRef.current) showcaseProg = easeTowards(showcaseProg, getProgress(showcaseSectionRef.current), 0.08);
          if (animate) animate(t);
          renderer.render(scene, camera);
        };
        loop(0);

        window.addEventListener("resize", onResize);
        const destroy = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("resize", onResize);
          if (dispose) dispose();
          renderer.dispose();
          if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        };
        cleanupFns.push(destroy);
      };

      // Hero canvas: box package with price tag (themed for second-hand trading)
      if (heroRef.current) {
        const container = heroRef.current;
        initScene(
          container,
          () => {
            const width = container.clientWidth;
            const height = Math.max(240, Math.floor(width * 0.6));
            return { width, height };
          },
          ({ THREE, scene, camera }) => {
            camera.position.z = 4;
            const ambient = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambient);
            const key = new THREE.DirectionalLight(0xffffff, 1.0);
            key.position.set(2, 3, 4);
            scene.add(key);

            // Box package
            const boxGeo = new THREE.BoxGeometry(1.6, 1.1, 1.1);
            const boxMat = new THREE.MeshStandardMaterial({ color: 0xc89b6d, roughness: 0.6, metalness: 0.05 });
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.y = 0.1;
            scene.add(box);

            // Lid (opens/closes)
            const lidGeo = new THREE.BoxGeometry(1.62, 0.08, 1.12);
            const lidMat = new THREE.MeshStandardMaterial({ color: 0xcfa57b, roughness: 0.55, metalness: 0.07 });
            const lid = new THREE.Mesh(lidGeo, lidMat);
            lid.position.y = 0.64;
            scene.add(lid);

            // Price tag hanging from a ring
            const ringGeo = new THREE.TorusGeometry(0.08, 0.02, 12, 32);
            const ringMat = new THREE.MeshStandardMaterial({ color: 0xb0c4de, metalness: 0.6, roughness: 0.25 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(0.85, 0.55, 0.55);
            scene.add(ring);

            const tagGroup = new THREE.Group();
            tagGroup.position.copy(ring.position);
            scene.add(tagGroup);
            const tagGeo = new THREE.PlaneGeometry(0.45, 0.65);
            const tagMat = new THREE.MeshStandardMaterial({ color: 0xff6f61, side: THREE.DoubleSide });
            const tag = new THREE.Mesh(tagGeo, tagMat);
            tag.position.y = -0.45;
            tag.rotation.y = -0.4;
            tagGroup.add(tag);

            // Small floating items emerging from the box
            const itemGeo = new THREE.BoxGeometry(0.16, 0.12, 0.06);
            const itemMat = new THREE.MeshStandardMaterial({ color: 0x4db6ac, roughness: 0.45, metalness: 0.2 });
            const items: Array<import("three").Mesh> = [];
            for (let i = 0; i < 8; i++) {
              const m = new THREE.Mesh(itemGeo, itemMat);
              m.position.set((Math.random() - 0.5) * 0.8, 0.15, (Math.random() - 0.5) * 0.5);
              m.rotation.y = Math.random() * Math.PI;
              items.push(m);
              scene.add(m);
            }

            return {
              animate: (t: number) => {
                const time = t * 0.001;
                // subtle bob for the box
                box.position.y = 0.1 + Math.sin(time * 1.2) * 0.03;
                // scroll-driven spin boost
                const heroP = heroProg;
                box.rotation.y = Math.sin(time * 0.6) * 0.12 + time * 0.15 + heroP * 0.8;
                box.rotation.x = Math.cos(time * 0.4) * 0.05;

                // lid opens/closes slightly
                lid.position.y = 0.64 + Math.sin(time * 1.3) * 0.01 + heroP * 0.02;
                lid.rotation.x = -0.35 - Math.sin(time * 1.2) * 0.25 - heroP * 0.35;
                lid.rotation.y = box.rotation.y * 0.25;

                // tag gentle swing
                tagGroup.rotation.z = Math.sin(time * 1.2) * 0.25 + heroP * 0.15;

                // items float upward in a spiral, then loop back inside
                items.forEach((m, i) => {
                  const phase = i / items.length;
                  const tt = (time * 0.6 + phase + heroP * 0.2) % 1;
                  const h = -0.1 + tt * 1.6; // height from inside box to above
                  const radius = 0.15 + tt * 0.55;
                  const ang = tt * Math.PI * 2 + i * 0.8;
                  m.position.x = Math.cos(ang) * radius;
                  m.position.z = Math.sin(ang) * radius * 0.7;
                  m.position.y = h;
                  m.rotation.y += 0.03;
                  m.rotation.x = Math.sin(time * 1.5 + i) * 0.2;
                });
              },
              dispose: () => {
                boxGeo.dispose();
                boxMat.dispose();
                lidGeo.dispose();
                lidMat.dispose();
                ringGeo.dispose();
                ringMat.dispose();
                tagGeo.dispose();
                tagMat.dispose();
                itemGeo.dispose();
                itemMat.dispose();
              },
            };
          }
        );
      }

      // Features canvas: two orbiting items symbolizing exchange
      if (featuresRef.current) {
        const container = featuresRef.current;
        initScene(
          container,
          () => {
            const width = container.clientWidth;
            const height = Math.max(200, Math.floor(width * 0.6));
            return { width, height };
          },
          ({ THREE, scene, camera }) => {
            camera.position.z = 4.5;
            const ambient = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambient);
            const key = new THREE.DirectionalLight(0xffffff, 1.0);
            key.position.set(2, 3, 4);
            scene.add(key);
            const rim = new THREE.DirectionalLight(0x66ddff, 0.5);
            rim.position.set(-3, -2, -4);
            scene.add(rim);

            // Platform
            const platformGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.15, 40);
            const platformMat = new THREE.MeshStandardMaterial({ color: 0x222831, metalness: 0.2, roughness: 0.7 });
            const platform = new THREE.Mesh(platformGeo, platformMat);
            platform.position.y = -0.6;
            scene.add(platform);

            // Two items (old goods) orbiting
            const itemGeoA = new THREE.BoxGeometry(0.6, 0.4, 0.2); // e.g., phone
            const itemMatA = new THREE.MeshStandardMaterial({ color: 0x4db6ac, roughness: 0.4, metalness: 0.2 });
            const itemA = new THREE.Mesh(itemGeoA, itemMatA);
            scene.add(itemA);

            const itemGeoB = new THREE.BoxGeometry(0.7, 0.5, 0.4); // e.g., camera body
            const itemMatB = new THREE.MeshStandardMaterial({ color: 0xffb74d, roughness: 0.45, metalness: 0.25 });
            const itemB = new THREE.Mesh(itemGeoB, itemMatB);
            scene.add(itemB);

            const radius = 1.9;

            return {
              animate: (t: number) => {
                const time = t * 0.001;
                const a = time * 0.8;
                const featP = featuresProg;
                itemA.position.set(Math.cos(a) * radius, Math.sin(a * 1.2) * 0.25, Math.sin(a) * radius * 0.4);
                itemA.rotation.y = a + Math.PI / 6;
                itemA.rotation.x = Math.sin(a) * 0.2;

                const b = a + Math.PI;
                itemB.position.set(Math.cos(b) * radius, Math.sin(b * 1.1) * 0.25, Math.sin(b) * radius * 0.4);
                itemB.rotation.y = b - Math.PI / 8;
                itemB.rotation.x = Math.cos(b) * 0.15;

                // scroll zoom hint and platform lift
                platform.position.y = -0.6 + featP * 0.12;
                camera.position.z = 4.5 - featP * 0.4;
              },
              dispose: () => {
                platformGeo.dispose();
                platformMat.dispose();
                itemGeoA.dispose();
                itemMatA.dispose();
                itemGeoB.dispose();
                itemMatB.dispose();
              },
            };
          }
        );
      }

      // Background particles canvas
      if (bgRef.current) {
        const container = bgRef.current;
        initScene(
          container,
          () => {
            const width = container.clientWidth;
            const height = container.clientHeight || window.innerHeight;
            return { width, height };
          },
          ({ THREE, scene, camera }) => {
            camera.position.z = 6;
            const particleCount = 600;
            const positions = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
              positions[i * 3] = (Math.random() - 0.5) * 20;
              positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
              positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({ color: 0x66ddff, size: 0.035 });
            const points = new THREE.Points(geo, mat);
            scene.add(points);

            return {
              animate: () => {
                const heroP = heroProg;
                const featP = featuresProg;
                const parallax = (heroP * 0.5 + featP * 0.8) * 0.005; // calmer parallax
                points.rotation.y += 0.0002 + parallax * 0.15; // slower rotation
                points.rotation.x += 0.0001 + parallax * 0.08;  // slower rotation
              },
              dispose: () => {
                geo.dispose();
                mat.dispose();
              },
            };
          }
        );
      }

      // Showcase podium with multiple items
      if (showcaseRef.current) {
        const container = showcaseRef.current;
        initScene(
          container,
          () => {
            const width = container.clientWidth;
            const height = Math.max(220, Math.floor(width * 0.56));
            return { width, height };
          },
          ({ THREE, scene, camera }) => {
            camera.position.set(0, 1.2, 5);
            const ambient = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambient);
            const key = new THREE.SpotLight(0xffffff, 1.3, 20, Math.PI / 6, 0.3, 1);
            key.position.set(3, 6, 4);
            scene.add(key);
            const fill = new THREE.DirectionalLight(0x88ccff, 0.6);
            fill.position.set(-3, 2, -4);
            scene.add(fill);

            const podiumGeo = new THREE.CylinderGeometry(1.7, 1.7, 0.2, 48);
            const podiumMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.65, metalness: 0.2 });
            const podium = new THREE.Mesh(podiumGeo, podiumMat);
            podium.position.y = -0.7;
            scene.add(podium);

            const turntable = new THREE.Group();
            scene.add(turntable);

            const makeItem = (color: number, x: number, z: number, scale: number) => {
              const geo = new THREE.BoxGeometry(0.6, 0.35, 0.2);
              const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.25 });
              const m = new THREE.Mesh(geo, mat);
              m.position.set(x, -0.15, z);
              m.scale.setScalar(scale);
              turntable.add(m);
              return { geo, mat, m };
            };

            const a = makeItem(0x90caf9, 1.2, 0.4, 1.0); // phone-like
            const b = makeItem(0xffcc80, -0.9, -0.6, 1.1); // camera-like
            const c = makeItem(0xa5d6a7, 0.2, -1.1, 0.9); // gadget-like

            return {
              animate: (t: number) => {
                const time = t * 0.001;
                const showP = showcaseSectionRef.current ? getProgress(showcaseSectionRef.current) : 0;
                podium.rotation.y = time * 0.1 + showP * 0.5;
                turntable.rotation.y = time * 0.4 + showP * 1.2;
                a.m.rotation.y = time * 0.8;
                b.m.rotation.y = -time * 0.7;
                c.m.rotation.y = time * 0.5;
                camera.position.y = 1.2 + showP * 0.2;
                camera.position.z = 5 - showP * 0.7;
                camera.lookAt(0, 0, 0);
              },
              dispose: () => {
                podiumGeo.dispose();
                podiumMat.dispose();
                a.geo.dispose(); a.mat.dispose();
                b.geo.dispose(); b.mat.dispose();
                c.geo.dispose(); c.mat.dispose();
              },
            };
          }
        );
      }
    })();

    return () => {
      cleanupFns.forEach((fn) => fn());
      cleanupFns = [];
    };
  }, []);

  return (
    <>
      <Head>
        <title>RetroTrade</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="RetroTrade home" />
      </Head>
      {/* Backgrounds */}
      <div ref={bgRef} className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 -z-20 bg-gradient-to-b from-foreground/[0.04] via-transparent to-foreground/[0.06]" aria-hidden="true" />

      <Navbar />

      {/* Hero with Three.js canvas */}
      <section ref={heroSectionRef} className="relative overflow-hidden">
        <Container className="py-16 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="text-center lg:text-left space-y-4">
              <Badge className="px-3 py-1" variant="secondary">Storyboard • Buôn bán & trao đổi đồ cũ</Badge>
              <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">
                Nơi đồ cũ tìm được chủ mới
              </h1>
              <p className="text-sm sm:text-base text-foreground/80 max-w-xl mx-auto lg:mx-0">
                Đăng tin nhanh, thương lượng trực tiếp, giao dịch an toàn. Xây dựng
                thị trường đồ cũ của bạn với hiệu ứng trực quan từ Three.js.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                <Button as="a" href="#start">Bắt đầu ngay</Button>
                <Button as="a" href="#features" variant="outline">Xem tính năng</Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div
                ref={heroRef}
                className="w-[min(720px,90vw)]"
                aria-label="Three.js demo: khối lập phương xoay"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Timeline / Steps */}
      <section id="start" className="py-12 sm:py-16">
        <Container>
        <SectionHeading>Quy trình giao dịch đơn giản</SectionHeading>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Đăng sản phẩm",
              desc: "Mô tả, hình ảnh, giá đề xuất trong vài phút.",
              step: 1,
            },
            {
              title: "Tìm kiếm/Nối ghép",
              desc: "Người mua phù hợp được gợi ý theo nhu cầu.",
              step: 2,
            },
            {
              title: "Thương lượng",
              desc: "Chat trực tiếp, đề xuất giá và điều kiện trao đổi.",
              step: 3,
            },
            {
              title: "Giao dịch an toàn",
              desc: "Xác nhận, đánh giá, và hoàn tất đơn minh bạch.",
              step: 4,
            },
          ].map((s) => (
            <Card key={s.step} className="backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold">
                    {s.step}
                  </span>
                  <CardTitle>{s.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p>{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        </Container>
      </section>

      {/* User Stories */}
      <section id="stories" className="py-12 sm:py-16">
        <Container>
        <SectionHeading>Câu chuyện người dùng</SectionHeading>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Người bán: Lan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
              Lan có chiếc máy ảnh cũ vẫn còn tốt. Cô đăng tin trong 3 phút, nhận
              gợi ý giá dựa trên thị trường, rồi thương lượng với người mua và chốt
              giao dịch an toàn.
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Đăng tin cực nhanh</li>
              <li>Gợi ý giá thông minh</li>
              <li>Chat và thương lượng tức thì</li>
            </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Người mua: Nam</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
              Nam tìm chiếc điện thoại phù hợp ngân sách. Hệ thống gợi ý sản phẩm
              gần đúng mong muốn, Nam trao đổi với người bán, xác nhận đơn và đánh giá.
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Tìm đúng nhu cầu</li>
              <li>Theo dõi trạng thái đơn</li>
              <li>Đánh giá minh bạch</li>
            </ul>
            </CardContent>
          </Card>
        </div>
        </Container>
      </section>

      {/* Themed Gallery */}
      <section id="gallery" className="pb-16">
        <Container>
        <SectionHeading>Một vài mặt hàng thường thấy</SectionHeading>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { src: "/window.svg", title: "Đồ gia dụng" },
            { src: "/globe.svg", title: "Thiết bị điện tử" },
            { src: "/file.svg", title: "Sách, băng đĩa" },
            { src: "/next.svg", title: "Phụ kiện, linh kiện" },
          ].map((g, i) => (
            <Card key={i} className="group hover:bg-foreground/5 transition-colors">
              <CardContent className="p-4">
                <div className="aspect-[4/3] flex items-center justify-center overflow-hidden rounded-md bg-foreground/5">
                  <Image src={g.src} alt={g.title} width={80} height={80} className="opacity-80 group-hover:opacity-100" />
                </div>
                <figcaption className="mt-3 text-sm text-center">{g.title}</figcaption>
              </CardContent>
            </Card>
          ))}
        </div>
        </Container>
      </section>

      {/* 3D Showcase Section */}
      <section ref={showcaseSectionRef} id="showcase" className="pb-20">
        <Container>
        <SectionHeading>Khu trưng bày 3D</SectionHeading>
        <div className="flex justify-center">
          <div
            ref={showcaseRef}
            className="w-[min(720px,92vw)]"
            aria-label="Three.js showcase podium"
          />
        </div>
        </Container>
      </section>

      {/* Features */}
      <section ref={featuresSectionRef} id="features" className="pb-16">
        <Container>
        <div className="mb-8 flex justify-center">
          <div
            ref={featuresRef}
            className="w-[min(560px,90vw)]"
            aria-label="Three.js demo: torus knot trao đổi"
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Đăng tin nhanh",
              desc: "Giao diện gọn gàng, quy trình ngắn giúp bạn lên tin tức thì.",
            },
            {
              title: "Chat & thương lượng",
              desc: "Trao đổi trực tiếp để đạt được mức giá tốt nhất.",
            },
            {
              title: "Gợi ý thông minh",
              desc: "Đề xuất sản phẩm và giá dựa trên dữ liệu thị trường.",
            },
            {
              title: "Bảo vệ người dùng",
              desc: "Báo cáo, đánh giá, và các cơ chế xác thực giúp yên tâm.",
            },
            {
              title: "Theo dõi đơn",
              desc: "Trạng thái rõ ràng từ lúc đăng đến khi hoàn tất.",
            },
            {
              title: "Hiệu ứng trực quan",
              desc: "Three.js làm nổi bật sản phẩm và tương tác hiện đại.",
            },
          ].map((f, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}