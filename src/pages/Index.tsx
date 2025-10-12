import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves, Fish, Trees, Shell, Sun, Wind, Snowflake, CloudRain, type LucideIcon } from "lucide-react";

type Ecosystem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const ecosystems: Ecosystem[] = [
  {
    icon: Waves,
    title: "바다",
    description: "지구의 가장 넓은 집! 고래, 상어, 거북이 등 수많은 생물들이 살고 있어요. 파도 소리를 들으며 바닷속 친구들을 상상해봐요.",
  },
  {
    icon: Fish,
    title: "강",
    description: "끊임없이 흐르는 민물의 길. 맑은 물에는 송어와 연어가, 강가에는 수달 친구들이 살고 있답니다.",
  },
  {
    icon: Trees,
    title: "숲",
    description: "나무들이 모여 만든 푸른 세상. 다람쥐, 토끼, 곰 아저씨까지 다양한 동물들의 보금자리가 되어줘요.",
  },
  {
    icon: Shell,
    title: "갯벌",
    description: "바닷물이 들어왔다 나갔다 하는 신기한 땅. 숨어있는 조개와 옆으로 걷는 게, 톡톡 튀는 짱뚱어를 찾아봐요.",
  },
  {
    icon: Sun,
    title: "사막",
    description: "뜨거운 모래와 강한 햇볕의 땅. 혹은 등에, 큰 귀는 사막여우에게 생존의 지혜를 가르쳐줘요.",
  },
  {
    icon: Wind,
    title: "초원",
    description: "드넓은 풀밭이 펼쳐진 동물의 왕국. 사자, 기린, 얼룩말이 자유롭게 뛰어다니는 곳이에요.",
  },
  {
    icon: Snowflake,
    title: "극지방",
    description: "얼음과 눈으로 뒤덮인 하얀 세상. 북극곰과 펭귄처럼 추위를 이겨내는 특별한 친구들이 살고 있어요.",
  },
  {
    icon: CloudRain,
    title: "열대우림",
    description: "일년 내내 비가 내리는 초록빛 정글. 원숭이, 앵무새, 나무늘보 등 신기한 동물들의 천국이랍니다.",
  },
];

const Index = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          다양한 생태계를 탐험해요!
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          지구에는 어떤 신기한 친구들이 살고 있을까요?
        </p>
      </header>
      <main className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ecosystems.map((eco) => (
          <Card key={eco.title} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex-row items-center gap-4 pb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <eco.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">{eco.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{eco.description}</p>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
};

export default Index;