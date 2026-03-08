import { AnalysisResult } from "./types";

/**
 * Mock analysis result for demonstration purposes
 * In production, this would be replaced with actual API calls to Google Gemini
 */
export const getMockAnalysisResult = (): AnalysisResult => ({
  summary:
    "This groundbreaking research paper introduces a novel approach to machine learning optimization that significantly reduces training time while maintaining model accuracy. The authors present a comprehensive framework that combines adaptive learning rates with dynamic batch sizing, demonstrating remarkable improvements across various deep learning architectures. The methodology has been rigorously tested on multiple benchmark datasets, showing consistent performance gains of 30-40% in training efficiency.",
  keyContributions: [
    "Developed an adaptive learning rate scheduler that automatically adjusts based on gradient variance patterns",
    "Introduced dynamic batch sizing technique that optimizes memory utilization during training",
    "Achieved 35% average reduction in training time across ResNet, Transformer, and CNN architectures",
    "Demonstrated scalability from small datasets (MNIST) to large-scale problems (ImageNet)",
    "Provided open-source implementation with comprehensive documentation for reproducibility",
  ],
  concepts: [
    {
      term: "Adaptive Learning Rate",
      explanation:
        "A training technique where the step size adjusts automatically during model training, similar to how a car's cruise control adjusts speed based on road conditions.",
    },
    {
      term: "Batch Size",
      explanation:
        "The number of training examples processed together in one forward/backward pass - like studying flashcards in groups rather than one at a time.",
    },
    {
      term: "Gradient Variance",
      explanation:
        "A measure of how much the learning direction changes between training steps, indicating the stability of the optimization process.",
    },
    {
      term: "Benchmark Dataset",
      explanation:
        "Standard test sets (like MNIST or ImageNet) used to compare different AI approaches, similar to standardized tests in education.",
    },
    {
      term: "Model Architecture",
      explanation:
        "The structural design of a neural network, defining how layers connect and information flows - like a building's blueprint.",
    },
    {
      term: "Training Efficiency",
      explanation:
        "How quickly and effectively a model learns from data, measured by time and computational resources needed.",
    },
    {
      term: "ResNet",
      explanation:
        "A popular deep learning architecture that uses 'skip connections' to train very deep networks, making it easier for information to flow through many layers.",
    },
    {
      term: "Transformer",
      explanation:
        "A modern neural network architecture that uses 'attention mechanisms' to process sequential data, powering models like ChatGPT.",
    },
  ],
  eli12:
    "Imagine you're learning to ride a bike. At first, you might wobble a lot and need small, careful movements. As you get better, you can make bigger adjustments and go faster. This research is like creating a smart training system for AI that works the same way! Instead of always learning at the same speed, the AI can speed up when it's doing well and slow down when things get tricky. The researchers also figured out a clever way to feed information to the AI - like studying flashcards in perfectly-sized groups rather than randomly. It's like having a super smart coach who knows exactly when to push you harder and when to take it easy. The result? The AI learns just as well but finishes its training in about two-thirds of the time - like finishing your homework 30 minutes faster while still getting an A!",
  quizQuestions: [
    {
      question:
        "What is the primary benefit of the adaptive learning rate approach described in this paper?",
      options: [
        "It makes the model more accurate",
        "It reduces training time while maintaining accuracy",
        "It requires less memory",
        "It works only with image data",
      ],
      correctAnswer: 1,
      explanation:
        "The paper's main contribution is reducing training time by 30-40% while keeping the same model accuracy through adaptive learning rates.",
    },
    {
      question: "What does dynamic batch sizing optimize during training?",
      options: [
        "Model accuracy only",
        "Memory utilization",
        "Dataset size",
        "Number of layers",
      ],
      correctAnswer: 1,
      explanation:
        "Dynamic batch sizing specifically targets memory utilization, allowing efficient use of available computational resources.",
    },
    {
      question:
        "Across how many different architectures was this method tested?",
      options: [
        "One (ResNet only)",
        "Two (ResNet and Transformers)",
        "Three (ResNet, Transformers, and CNNs)",
        "Five different architectures",
      ],
      correctAnswer: 2,
      explanation:
        "The research validated the approach on three major architectures: ResNet, Transformer, and CNN models.",
    },
    {
      question:
        "What percentage improvement in training efficiency did the researchers achieve?",
      options: [
        "10-15% improvement",
        "20-25% improvement",
        "30-40% improvement",
        "50-60% improvement",
      ],
      correctAnswer: 2,
      explanation:
        "The paper reports consistent performance gains of 30-40% in training efficiency across various experiments.",
    },
    {
      question:
        "Which of these is NOT mentioned as a key contribution of this paper?",
      options: [
        "Open-source implementation provided",
        "New neural network architecture invented",
        "Scalability demonstrated across dataset sizes",
        "Adaptive learning rate scheduler developed",
      ],
      correctAnswer: 1,
      explanation:
        "The paper improves training methods for existing architectures rather than inventing a new architecture.",
    },
  ],
});
