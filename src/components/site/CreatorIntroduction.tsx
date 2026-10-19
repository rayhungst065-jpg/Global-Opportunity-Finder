import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import creatorPhoto from "@/assets/creator-tzu-jui-hung.png.asset.json";

const shortIntroduction = [
  "I'm a high school student who created Global Opportunity Finder because I noticed how difficult it can be for students to find opportunities that match their interests and future goals. Competitions, research programs, internships, volunteer opportunities, and awards are often scattered across different websites, making it hard to know where to start.",
  "I wanted to create a place where students could discover opportunities from around the world, explore their interests, and connect with others who share similar goals. My goal is to make finding opportunities easier and help more students take meaningful steps toward their futures.",
];

const fullIntroduction = [
  "I'm the student creator of Global Opportunity Finder.",
  "I started this project because I noticed how difficult it can be for students to find opportunities that match their interests and future goals. Competitions, research programs, internships, volunteer opportunities, and awards are often scattered across different websites. Students may spend a lot of time searching for information, comparing options, and keeping track of deadlines.",
  "I also realized that students from different countries and backgrounds may have different access to information and opportunities. Some students already know where to look, while others may not know that certain competitions, research programs, or other opportunities even exist. I wanted to help make that information easier to discover, no matter where students are from.",
  "That's why I created Global Opportunity Finder. I wanted to bring different opportunities together in one place so students can explore possibilities that match their interests, intended majors, and future goals. I also hope the platform can help students connect with others who share similar interests and find people to collaborate with on projects, competitions, and research.",
  "My goal is to make discovering opportunities less confusing and more accessible. I hope this platform encourages students to explore something new, take initiative, and find opportunities they might not have discovered otherwise.",
  "Global Opportunity Finder is still growing, and I know there is always room to improve. I'm building this project with students' needs in mind, and feedback from users can help me understand what is useful and what could be better.",
  "Thank you for visiting Global Opportunity Finder and being part of this journey!",
];

export function CreatorIntroduction({ full = false }: { full?: boolean }) {
  return (
    <section id={full ? "creator" : "meet-the-creator"} aria-labelledby={full ? "creator-heading" : "meet-the-creator-heading"} className="mx-auto grid max-w-6xl scroll-mt-24 items-start gap-8 px-5 py-16 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:gap-12 md:py-20">
      <img src={creatorPhoto.url} alt="Tzu Jui Hung, creator of Global Opportunity Finder" width={768} height={1024} loading="lazy" className="mx-auto h-auto w-full max-w-64 rounded-lg object-contain md:mx-0 md:max-w-full" />
      <div className="min-w-0">
        {!full && <h2 id="meet-the-creator-heading" className="text-sm font-medium text-primary">Meet the Creator</h2>}
        {full ? <h2 id="creator-heading" className="font-display text-2xl font-semibold text-foreground md:text-3xl">Hi, I'm Tzu Jui Hung!</h2> : <h3 className="mt-3 font-display text-2xl font-semibold text-foreground md:text-3xl">Hi, I'm Tzu Jui Hung!</h3>}
        <div className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground">
          {(full ? fullIntroduction : shortIntroduction).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {full && <p className="font-medium text-foreground">Let's discover more opportunities together.</p>}
        </div>
        {!full && <Button asChild className="mt-7 h-auto whitespace-normal rounded-full px-6 py-3"><Link to="/about" hash="creator">Learn More About Me</Link></Button>}
      </div>
    </section>
  );
}