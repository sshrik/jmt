import { createFileRoute } from "@tanstack/react-router";
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  List,
  Accordion,
  Alert,
  Button,
  Grid,
  Box,
  Paper,
  ThemeIcon,
} from "@mantine/core";
import {
  IconBook,
  IconBulb,
  IconChartLine,
  IconInfoCircle,
  IconPlaylist,
  IconRocket,
  IconSettings,
  IconTrendingUp,
  IconUsers,
  IconExternalLink,
  IconTarget,
  IconTools,
  IconTrophy,
} from "@tabler/icons-react";

export const Route = createFileRoute("/manual")({
  component: ManualPage,
});

function ManualPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* 헤더 */}
        <Box>
          <Group gap="sm" mb="md">
            <ThemeIcon size="lg" variant="light">
              <IconBook size={24} />
            </ThemeIcon>
            <Title order={1}>사용자 메뉴얼</Title>
          </Group>
          <Text size="lg" c="dimmed">
            JMT 투자 전략 플랫폼을 처음 사용하시나요? 이 가이드를 따라 하시면
            쉽게 시작할 수 있습니다.
          </Text>
        </Box>

        {/* 빠른 시작 가이드 */}
        <Alert
          icon={<IconRocket size={20} />}
          title="5분 만에 시작하기"
          color="blue"
          variant="light"
        >
          <Text size="sm">
            ① 새 프로젝트 생성 → ② 투자 전략 설계 → ③ 백테스트 실행 → ④ 결과
            분석
          </Text>
        </Alert>

        {/* 메인 가이드 섹션 */}
        <Accordion multiple defaultValue={["getting-started"]}>
          {/* 시작하기 */}
          <Accordion.Item value="getting-started">
            <Accordion.Control icon={<IconRocket size={20} />}>
              <Title order={3}>시작하기</Title>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Text>
                  JMT는{" "}
                  <strong>노코드 투자 전략 설계 및 백테스트 플랫폼</strong>
                  입니다. 프로그래밍 지식 없이도 직관적인 UI로 투자 전략을
                  만들고 검증할 수 있습니다.
                </Text>

                <Card withBorder p="md">
                  <Title order={4} mb="sm">
                    첫 번째 프로젝트 만들기
                  </Title>
                  <List spacing="xs">
                    <List.Item>대시보드에서 "새 프로젝트" 버튼 클릭</List.Item>
                    <List.Item>
                      프로젝트 이름과 설명 입력 (예: "삼성전자 단순매매")
                    </List.Item>
                    <List.Item>생성 후 자동으로 편집 페이지로 이동</List.Item>
                  </List>
                </Card>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* 전략 설계 */}
          <Accordion.Item value="strategy-design">
            <Accordion.Control icon={<IconTarget size={20} />}>
              <Title order={3}>투자 전략 설계</Title>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Text>
                  JMT는 두 가지 방식으로 전략을 설계할 수 있습니다. 두 방식은
                  실시간으로 동기화됩니다.
                </Text>

                <Grid>
                  <Grid.Col span={6}>
                    <Card withBorder p="md" h="100%">
                      <Group gap="sm" mb="sm">
                        <ThemeIcon variant="light" color="blue">
                          <IconPlaylist size={16} />
                        </ThemeIcon>
                        <Title order={4}>룰 기반 에디터</Title>
                      </Group>
                      <Text size="sm" mb="md">
                        조건-액션 쌍으로 논리적으로 전략을 구성합니다.
                      </Text>
                      <Text size="xs" c="dimmed">
                        • 직관적이고 이해하기 쉬움
                        <br />
                        • 초보자에게 추천
                        <br />• 간단한 전략에 적합
                      </Text>
                    </Card>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Card withBorder p="md" h="100%">
                      <Group gap="sm" mb="sm">
                        <ThemeIcon variant="light" color="green">
                          <IconChartLine size={16} />
                        </ThemeIcon>
                        <Title order={4}>플로우차트 에디터</Title>
                      </Group>
                      <Text size="sm" mb="md">
                        드래그앤드롭으로 시각적으로 전략을 설계합니다.
                      </Text>
                      <Text size="xs" c="dimmed">
                        • 복잡한 전략 표현 가능
                        <br />
                        • 시각적으로 이해하기 쉬움
                        <br />• 고급 사용자에게 추천
                      </Text>
                    </Card>
                  </Grid.Col>
                </Grid>

                <Card withBorder p="md">
                  <Title order={4} mb="sm">
                    기본 전략 예시: 고속도로 매매법
                  </Title>
                  <Text size="sm" mb="md">
                    주가 변동폭에 따라 차등 매매하는 전략입니다:
                  </Text>
                  <List spacing="xs" size="sm">
                    <List.Item>
                      <strong>0-2% 하락</strong> → 10% 매수
                    </List.Item>
                    <List.Item>
                      <strong>2-4% 하락</strong> → 20% 매수
                    </List.Item>
                    <List.Item>
                      <strong>4%+ 하락</strong> → 30% 매수
                    </List.Item>
                    <List.Item>
                      <strong>상승 시</strong> → 동일 비율로 매도
                    </List.Item>
                  </List>
                </Card>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* 백테스트 실행 */}
          <Accordion.Item value="backtest">
            <Accordion.Control icon={<IconTrendingUp size={20} />}>
              <Title order={3}>백테스트 실행 및 분석</Title>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Text>
                  전략을 설계했다면 과거 30년간의 실제 주식 데이터로 성과를
                  검증해보세요.
                </Text>

                <Card withBorder p="md">
                  <Title order={4} mb="sm">
                    백테스트 설정
                  </Title>
                  <List spacing="xs">
                    <List.Item>
                      <strong>종목 선택</strong>: 삼성전자, SK하이닉스, NAVER 등
                    </List.Item>
                    <List.Item>
                      <strong>기간 설정</strong>: 시작일과 종료일 선택
                    </List.Item>
                    <List.Item>
                      <strong>초기 투자금</strong>: 시뮬레이션할 금액
                    </List.Item>
                    <List.Item>
                      <strong>수수료율</strong>: 일반적으로 0.015% (1.5%o)
                    </List.Item>
                    <List.Item>
                      <strong>슬리피지</strong>: 주문가-체결가 차이, 보통 0.1%
                    </List.Item>
                  </List>
                </Card>

                <Card withBorder p="md">
                  <Title order={4} mb="sm">
                    결과 해석
                  </Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500} mb="xs">
                        주요 지표
                      </Text>
                      <List spacing="xs" size="sm">
                        <List.Item>
                          <strong>총 수익률</strong>: 투자 성과 (% 단위)
                        </List.Item>
                        <List.Item>
                          <strong>최대 낙폭</strong>: 최대 손실 구간
                        </List.Item>
                        <List.Item>
                          <strong>거래 횟수</strong>: 총 매수/매도 건수
                        </List.Item>
                        <List.Item>
                          <strong>수익 거래 비율</strong>: 성공한 거래 비율
                        </List.Item>
                      </List>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500} mb="xs">
                        차트 분석
                      </Text>
                      <List spacing="xs" size="sm">
                        <List.Item>
                          <strong>포트폴리오 가치</strong>: 좌측 Y축 (원 단위)
                        </List.Item>
                        <List.Item>
                          <strong>수익률</strong>: 우측 Y축 (% 단위)
                        </List.Item>
                        <List.Item>
                          <strong>거래 내역</strong>: 매수/매도 기록 및 사유
                        </List.Item>
                      </List>
                    </Grid.Col>
                  </Grid>
                </Card>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* 주요 기능 */}
          <Accordion.Item value="features">
            <Accordion.Control icon={<IconTools size={20} />}>
              <Title order={3}>주요 기능 활용법</Title>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={6}>
                    <Paper withBorder p="md" h="100%">
                      <Group gap="sm" mb="sm">
                        <ThemeIcon variant="light">
                          <IconChartLine size={16} />
                        </ThemeIcon>
                        <Title order={4}>대시보드</Title>
                      </Group>
                      <List spacing="xs" size="sm">
                        <List.Item>전체 프로젝트 성과 한눈에 확인</List.Item>
                        <List.Item>수익률 순위로 우수 전략 파악</List.Item>
                        <List.Item>프로젝트 생성/수정/삭제</List.Item>
                      </List>
                    </Paper>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Paper withBorder p="md" h="100%">
                      <Group gap="sm" mb="sm">
                        <ThemeIcon variant="light" color="blue">
                          <IconTrendingUp size={16} />
                        </ThemeIcon>
                        <Title order={4}>주식 추이 확인</Title>
                      </Group>
                      <List spacing="xs" size="sm">
                        <List.Item>30년간 주가 데이터 확인</List.Item>
                        <List.Item>커스텀 기간 설정</List.Item>
                        <List.Item>다양한 종목 지원</List.Item>
                      </List>
                    </Paper>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Paper withBorder p="md" h="100%">
                      <Group gap="sm" mb="sm">
                        <ThemeIcon variant="light" color="green">
                          <IconSettings size={16} />
                        </ThemeIcon>
                        <Title order={4}>환경설정</Title>
                      </Group>
                      <List spacing="xs" size="sm">
                        <List.Item>다크모드/라이트모드 전환</List.Item>
                        <List.Item>데이터 백업/복원</List.Item>
                        <List.Item>알림 설정</List.Item>
                      </List>
                    </Paper>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Paper withBorder p="md" h="100%">
                      <Group gap="sm" mb="sm">
                        <ThemeIcon variant="light" color="orange">
                          <IconUsers size={16} />
                        </ThemeIcon>
                        <Title order={4}>버전 관리</Title>
                      </Group>
                      <List spacing="xs" size="sm">
                        <List.Item>전략 변경사항 추적</List.Item>
                        <List.Item>백테스트 결과 이력 관리</List.Item>
                        <List.Item>여러 버전 성과 비교</List.Item>
                      </List>
                    </Paper>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* 팁과 모범 사례 */}
          <Accordion.Item value="tips">
            <Accordion.Control icon={<IconBulb size={20} />}>
              <Title order={3}>팁과 모범 사례</Title>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Card withBorder p="md">
                  <Group gap="sm" mb="sm">
                    <ThemeIcon color="yellow" variant="light">
                      <IconTrophy size={16} />
                    </ThemeIcon>
                    <Title order={4}>성공적인 전략 설계를 위한 팁</Title>
                  </Group>
                  <List spacing="sm">
                    <List.Item>
                      <strong>단순하게 시작하세요</strong>: 복잡한 전략보다는
                      이해하기 쉬운 전략부터
                    </List.Item>
                    <List.Item>
                      <strong>충분한 백테스트 기간</strong>: 최소 3-5년 이상의
                      데이터로 검증
                    </List.Item>
                    <List.Item>
                      <strong>리스크 관리</strong>: 최대 낙폭을 확인하고 감내할
                      수 있는 수준인지 점검
                    </List.Item>
                    <List.Item>
                      <strong>다양한 시장 상황 고려</strong>: 상승장, 하락장,
                      횡보장에서 모두 테스트
                    </List.Item>
                    <List.Item>
                      <strong>정기적인 점검</strong>: 시장 환경 변화에 따라 전략
                      유효성 재검토
                    </List.Item>
                  </List>
                </Card>

                <Alert
                  icon={<IconInfoCircle size={20} />}
                  title="주의사항"
                  color="orange"
                  variant="light"
                >
                  <Text size="sm">
                    백테스트 결과는 과거 데이터 기반 시뮬레이션입니다. 실제 투자
                    시에는 시장 환경, 거래량, 정치적 요인 등 다양한 변수가
                    영향을 미칠 수 있으므로 신중하게 판단하시기 바랍니다.
                  </Text>
                </Alert>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* FAQ */}
          <Accordion.Item value="faq">
            <Accordion.Control icon={<IconInfoCircle size={20} />}>
              <Title order={3}>자주 묻는 질문 (FAQ)</Title>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Card withBorder p="md">
                  <Text fw={500} mb="xs">
                    Q. 백테스트 데이터는 얼마나 신뢰할 수 있나요?
                  </Text>
                  <Text size="sm" c="dimmed">
                    A. Yahoo Finance에서 제공하는 30년간의 실제 주가 데이터를
                    사용합니다. 수수료와 슬리피지도 반영하여 실제 거래와 유사한
                    환경을 제공합니다.
                  </Text>
                </Card>

                <Card withBorder p="md">
                  <Text fw={500} mb="xs">
                    Q. 데이터가 사라질 걱정은 없나요?
                  </Text>
                  <Text size="sm" c="dimmed">
                    A. 모든 데이터는 브라우저 로컬 스토리지에 저장됩니다.
                    환경설정에서 데이터를 백업하여 다른 기기나 브라우저에서도
                    사용할 수 있습니다.
                  </Text>
                </Card>

                <Card withBorder p="md">
                  <Text fw={500} mb="xs">
                    Q. 모바일에서도 사용할 수 있나요?
                  </Text>
                  <Text size="sm" c="dimmed">
                    A. 태블릿 이상의 화면에서 최적화되어 있습니다. 복잡한 전략
                    설계는 데스크톱 환경을 권장합니다.
                  </Text>
                </Card>

                <Card withBorder p="md">
                  <Text fw={500} mb="xs">
                    Q. 실제 거래 연동은 지원하나요?
                  </Text>
                  <Text size="sm" c="dimmed">
                    A. 현재 버전(v1.0)은 백테스트 전용입니다. 향후 버전에서
                    실시간 데이터 연동과 알림 기능을 제공할 예정입니다.
                  </Text>
                </Card>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        {/* 추가 도움 */}
        <Card withBorder p="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Title order={4} mb="sm">
                더 궁금한 것이 있으시나요?
              </Title>
              <Text size="sm" c="dimmed" mb="md">
                GitHub에서 이슈를 등록하거나 개발자에게 직접 문의해보세요.
              </Text>
            </Box>
            <Group gap="sm">
              <Button
                variant="light"
                leftSection={<IconExternalLink size={16} />}
                component="a"
                href="https://github.com/sshrik/jmt/issues"
                target="_blank"
              >
                GitHub Issues
              </Button>
              <Button
                variant="light"
                leftSection={<IconUsers size={16} />}
                component="a"
                href="https://github.com/sshrik"
                target="_blank"
              >
                개발자 프로필
              </Button>
            </Group>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
