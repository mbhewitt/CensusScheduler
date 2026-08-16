"use client";

import {
  ExpandMore as ExpandMoreIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";

import NextLink from "next/link";
import { useState } from "react";

import { Hero } from "@/components/layout/Hero";

// Renders a course exported from Burning Man Hive. Everything referenced here
// lives under /training, so it renders with no network access.

import type {
  Course,
  IBlock,
  ILink,
  INode,
  IQuiz,
} from "@/components/types/training";

// Links that resolve without a network: bundled assets, other courses in this
// app, and mailto: handoffs. Open-web links are shown as muted text rather
// than dead links, since they cannot load from the Census Lab.
const OFFLINE_SAFE = new Set(["asset", "course", "email"]);

const ParagraphLinks = ({ links }: { links: ILink[] }) => (
  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
    {links.map((link, i) =>
      OFFLINE_SAFE.has(link.kind) ? (
        <Button
          key={i}
          size="small"
          href={link.href}
          {...(link.kind === "course" ? { component: NextLink } : {})}
          sx={{ textTransform: "none" }}
        >
          {link.text || "Open"}
        </Button>
      ) : (
        <Typography key={i} variant="caption" color="text.secondary">
          {link.text} (needs internet)
        </Typography>
      )
    )}
  </Stack>
);

const BlockView = ({ block }: { block: IBlock }) => {
  switch (block.type) {
    case "heading":
      return (
        <Typography
          variant={block.level <= 3 ? "h6" : "subtitle1"}
          sx={{ fontWeight: 700, mt: 2, mb: 1 }}
        >
          {block.text}
        </Typography>
      );

    case "paragraph":
      return (
        <>
          <Typography sx={{ mb: block.links?.length ? 0.5 : 1.5 }}>{block.text}</Typography>
          {block.links?.length ? <ParagraphLinks links={block.links} /> : null}
        </>
      );

    case "list":
      return (
        <List
          disablePadding
          sx={{ listStyle: block.ordered ? "decimal" : "disc", pl: 4, mb: 1.5 }}
        >
          {block.items.map((item, i) => (
            <ListItem key={i} disablePadding sx={{ display: "list-item" }}>
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>
      );

    case "image":
      return (
        <Box
          component="img"
          src={block.src}
          alt={block.alt}
          loading="lazy"
          sx={{ display: "block", width: "100%", maxWidth: 720, height: "auto", borderRadius: 1, my: 2 }}
        />
      );

    case "quote":
      return (
        <Box sx={{ borderLeft: 3, borderColor: "primary.main", pl: 2, my: 2 }}>
          <Typography sx={{ fontStyle: "italic" }}>{block.text}</Typography>
        </Box>
      );

    case "table":
      return (
        <Table size="small" sx={{ my: 2 }}>
          <TableBody>
            {block.rows.map((row, r) => (
              <TableRow key={r}>
                {row.map((cell, c) => (
                  <TableCell key={c}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );

    // A training manual or shift-lead guide. On Hive these were headings with
    // the PDF living in Google Drive; the file is bundled here instead.
    case "document":
      return (
        <Button
          href={block.href}
          rel="noopener noreferrer"
          startIcon={<PictureAsPdfIcon />}
          target="_blank"
          variant="outlined"
          sx={{ my: 1, justifyContent: "flex-start", textTransform: "none" }}
        >
          {block.title}
          <Typography component="span" color="text.secondary" variant="caption" sx={{ ml: 1 }}>
            PDF, {block.sizeKb} KB
          </Typography>
        </Button>
      );

    default:
      return null;
  }
};

const Blocks = ({ blocks }: { blocks: IBlock[] }) => (
  <>
    {blocks.map((block, i) => (
      <BlockView key={i} block={block} />
    ))}
  </>
);

const Audio = ({ clips }: { clips: INode["audio"] }) =>
  clips.length === 0 ? null : (
    <Stack spacing={1} sx={{ my: 2 }}>
      {clips.map((clip) => (
        <Box key={clip.src}>
          <Typography variant="caption">{clip.name}</Typography>
          <Box component="audio" controls preload="none" src={clip.src} sx={{ width: "100%" }} />
        </Box>
      ))}
    </Stack>
  );

const LessonView = ({ lesson }: { lesson: INode }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
      {lesson.title}
    </Typography>
    <Audio clips={lesson.audio} />
    <Blocks blocks={lesson.blocks} />
  </Box>
);

// Self-check only — the answer key ships in the JSON, so this is practice
// rather than assessment.
const QuizView = ({ quiz }: { quiz: IQuiz }) => {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const correctCount = quiz.questions.filter((q) =>
    q.choices.some((c) => c.id === picked[q.id] && c.correct)
  ).length;

  return (
    <Card sx={{ my: 2 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {quiz.title}
          </Typography>
          <Chip size="small" label={`${quiz.questions.length} questions`} />
        </Stack>

        <Blocks blocks={quiz.blocks} />

        {quiz.questions.map((question, qi) => (
          <Box key={question.id} sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              {qi + 1}. {question.text}
            </Typography>

            {question.image && (
              <Box
                component="img"
                src={question.image}
                alt=""
                loading="lazy"
                sx={{ display: "block", width: "100%", maxWidth: 560, height: "auto", mb: 1 }}
              />
            )}

            <Stack spacing={1}>
              {question.choices.map((choice) => {
                const isPicked = picked[question.id] === choice.id;
                const reveal = checked && isPicked;
                return (
                  <Button
                    key={choice.id}
                    variant={isPicked ? "contained" : "outlined"}
                    color={reveal ? (choice.correct ? "success" : "error") : "primary"}
                    onClick={() => setPicked((prev) => ({ ...prev, [question.id]: choice.id }))}
                    sx={{ justifyContent: "flex-start", textTransform: "none" }}
                  >
                    {choice.text}
                  </Button>
                );
              })}
            </Stack>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="contained" onClick={() => setChecked(true)}>
            Check answers
          </Button>
          {checked && (
            <Typography>
              {correctCount} of {quiz.questions.length} correct
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// Replaces the "record your completion" button that used to link out to the
// volunteering site. `confirmationCode` is op_trainings.code for this course —
// resolve it server-side rather than baking it into the exported JSON, so the
// database stays the single source of truth.
//
// Note: /training/confirmation/[code] confirms on visit, with no second
// click. On a shared lab tablet that means whoever is signed in at that moment
// gets the credit, so this deliberately sits behind its own tap.
const CompletionCta = ({ code, courseTitle }: { code: string; courseTitle: string }) => (
  <Card sx={{ my: 3 }}>
    <CardContent>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Record your completion of this course
      </Typography>
      <Typography sx={{ mb: 2 }}>
        This marks <strong>{courseTitle}</strong> complete on your volunteer account.
        Make sure you are signed in as yourself before continuing.
      </Typography>
      <Button
        component={NextLink}
        href={`/training/confirmation/${code}`}
        variant="contained"
        size="large"
      >
        Record my completion
      </Button>
    </CardContent>
  </Card>
);

export const TrainingCourse = ({
  course,
  confirmationCode,
}: {
  course: Course;
  confirmationCode?: string;
}) => (
  <>
    <Hero
      imageStyles={{ backgroundImage: "url(/banners/question-seamless.jpg)", backgroundSize: "300px 300px" }}
      text={course.title}
    />

    <Container component="main">
      {course.overview && (
        <Box component="section" sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Blocks blocks={course.overview.blocks} />
            </CardContent>
          </Card>
        </Box>
      )}

      <Box component="section" sx={{ mb: 4 }}>
        {course.sections.map((section) => (
          <Accordion key={section.id} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: 700 }}>{section.title}</Typography>
                <Chip size="small" label={`${section.lessons.length} lessons`} />
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <Blocks blocks={section.blocks} />
              {section.lessons.map((lesson) => (
                <LessonView key={lesson.id} lesson={lesson} />
              ))}
              {section.quizzes.map((quiz) => (
                <QuizView key={quiz.id} quiz={quiz} />
              ))}
            </AccordionDetails>
          </Accordion>
        ))}

        {course.ungroupedLessons?.map((lesson) => (
          <Accordion key={lesson.id} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 700 }}>{lesson.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Blocks blocks={lesson.blocks} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {confirmationCode && (
        <Box component="section" sx={{ mb: 4 }}>
          <CompletionCta code={confirmationCode} courseTitle={course.title} />
        </Box>
      )}
    </Container>
  </>
);
