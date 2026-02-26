"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import {
    BookOpen,
    Users,
    BarChart3,
    Globe,
    Mail,
    Github,
    Target,
    Eye,
} from "lucide-react";

const teamMembers = [
    { name: "Nguyen Minh Cuong", role: "Founder & Developer", avatar: "👨‍💻" },
    { name: "Tran Thi B", role: "UI/UX Designer", avatar: "🎨" },
    { name: "Le Van C", role: "Backend Engineer", avatar: "⚙️" },
    { name: "Pham D", role: "Content Manager", avatar: "📝" },
];

const AboutPage = () => {
    const t = useTranslations("aboutPage");

    const stats = [
        { value: "10,000+", label: t("statUsers"), icon: Users },
        { value: "5,000+", label: t("statQuizzes"), icon: BookOpen },
        { value: "500K+", label: t("statQuestions"), icon: BarChart3 },
        { value: "25+", label: t("statCountries"), icon: Globe },
    ];

    const features = [
        { icon: BookOpen, title: t("feature1Title"), desc: t("feature1Desc"), color: "text-blue-500" },
        { icon: Users, title: t("feature2Title"), desc: t("feature2Desc"), color: "text-green-500" },
        { icon: BarChart3, title: t("feature3Title"), desc: t("feature3Desc"), color: "text-purple-500" },
        { icon: Globe, title: t("feature4Title"), desc: t("feature4Desc"), color: "text-orange-500" },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="text-center mb-16 py-12">
                <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {t("title")}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t("subtitle")}
                </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <Card className="p-8 border-l-4 border-l-primary">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Target className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">{t("missionTitle")}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{t("missionDesc")}</p>
                </Card>

                <Card className="p-8 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Eye className="w-6 h-6 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold">{t("visionTitle")}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{t("visionDesc")}</p>
                </Card>
            </div>

            {/* Stats */}
            <div className="mb-16">
                <h2 className="text-2xl font-bold text-center mb-8">{t("statsTitle")}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="text-center p-6 hover:shadow-lg transition-shadow">
                            <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                            <div className="text-3xl font-bold mb-1">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Features */}
            <div className="mb-16">
                <h2 className="text-2xl font-bold text-center mb-8">{t("featuresTitle")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature) => (
                        <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
                            <CardContent className="p-0 flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Team */}
            <div className="mb-16">
                <h2 className="text-2xl font-bold text-center mb-2">{t("teamTitle")}</h2>
                <p className="text-center text-muted-foreground mb-8">{t("teamSubtitle")}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {teamMembers.map((member) => (
                        <Card key={member.name} className="text-center p-6 hover:shadow-lg transition-shadow">
                            <div className="text-5xl mb-3">{member.avatar}</div>
                            <h3 className="font-semibold text-sm">{member.name}</h3>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Contact */}
            <div className="text-center py-12 bg-muted/30 rounded-2xl px-6">
                <h2 className="text-2xl font-bold mb-2">{t("contactTitle")}</h2>
                <p className="text-muted-foreground mb-6">{t("contactDesc")}</p>
                <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" asChild>
                        <a href="mailto:contact@quizme.com">
                            <Mail className="w-4 h-4 mr-2" />
                            {t("contactEmail")}
                        </a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a href="https://github.com/NMCuonG08/Quiz-Online-Project" target="_blank" rel="noopener noreferrer">
                            <Github className="w-4 h-4 mr-2" />
                            {t("contactGithub")}
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
