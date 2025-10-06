"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const team = [
  {
    name: "Nguyễn Văn A",
    role: "CEO & Founder",
    avatar: "/professional-ceo.jpg",
    bio: "10 năm kinh nghiệm trong lĩnh vực công nghệ và bền vững",
    gradient: "from-indigo-500 to-purple-500",
    social: { linkedin: "#", twitter: "#" },
  },
  {
    name: "Trần Thị B",
    role: "CTO",
    avatar: "/professional-cto.jpg",
    bio: "Chuyên gia về phát triển sản phẩm và công nghệ",
    gradient: "from-purple-500 to-pink-500",
    social: { linkedin: "#", twitter: "#" },
  },
  {
    name: "Lê Văn C",
    role: "Head of Design",
    avatar: "/professional-designer.jpg",
    bio: "Đam mê tạo ra trải nghiệm người dùng tuyệt vời",
    gradient: "from-pink-500 to-orange-500",
    social: { linkedin: "#", twitter: "#" },
  },
  {
    name: "Phạm Thị D",
    role: "Head of Marketing",
    avatar: "/professional-marketer.jpg",
    bio: "Chuyên gia về xây dựng thương hiệu và cộng đồng",
    gradient: "from-orange-500 to-red-500",
    social: { linkedin: "#", twitter: "#" },
  },
]

export function AboutTeam() {
  const sectionRef = useRef<HTMLElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll(".team-card")
            cards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add("animate-fade-in-up")
              }, index * 150)
            })
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative z-10 py-32 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Đội ngũ của{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              chúng tôi
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Những con người tài năng và đam mê đang xây dựng tương lai bền vững
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <Card
              key={index}
              className="team-card opacity-0 group hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border-0 overflow-hidden relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <CardContent className="p-8 text-center space-y-4 relative z-10">
                <div className="relative inline-block">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${member.gradient} blur-xl opacity-50 group-hover:opacity-100 transition-opacity rounded-full`}
                  />
                  <Avatar className="w-32 h-32 mx-auto relative border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                    <AvatarFallback className={`text-3xl bg-gradient-to-br ${member.gradient} text-white`}>
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="group-hover:text-white transition-colors">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p
                    className={`font-medium bg-gradient-to-r ${member.gradient} bg-clip-text text-transparent group-hover:text-white`}
                  >
                    {member.role}
                  </p>
                </div>

                <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors">{member.bio}</p>

                <div
                  className={`flex gap-3 justify-center transition-all duration-500 ${hoveredIndex === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                >
                  <a
                    href={member.social.linkedin}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <span className="text-white">in</span>
                  </a>
                  <a
                    href={member.social.twitter}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <span className="text-white">𝕏</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
