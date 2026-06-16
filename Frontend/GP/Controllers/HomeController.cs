using System.Diagnostics;
using GP.Models;
using Microsoft.AspNetCore.Mvc;

namespace GP.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        public IActionResult About()
        {
            return View();
        }

        public IActionResult Contact()
        {
            return View();
        }

        public IActionResult Teacher()
        {
            return View();
        }

        public IActionResult Analysis()
        {
            return View();
        }

        public IActionResult History()
        {
            return View();
        }

        public IActionResult ClassAnalysis()
        {
            return View();
        }

        public IActionResult StudentsList()
        {
            return View();
        }

        public IActionResult WeakStudents()
        {
            return View();
        }

        public IActionResult TeacherQuizzes()
        {
            return View();
        }

        public IActionResult TeacherQuizReviews()
        {
            return View();
        }

        public IActionResult TeacherQuizReviewed()
        {
            return View();
        }

        public IActionResult TeacherQuizReviewDetail(string quizResultId)
        {
            ViewData["QuizResultId"] = quizResultId;
            return View();
        }

        public IActionResult StudentProfile(string studentId)
        {
            ViewData["StudentId"] = studentId;
            return View();
        }

        public IActionResult ParentDashboard()
        {
            return View();
        }

        public IActionResult InstitutionDashboard()
        {
            return View();
        }

        public IActionResult InstitutionTeachers()
        {
            return View();
        }

        public IActionResult InstitutionCommunications()
        {
            return View();
        }

        public IActionResult InstitutionSettings()
        {
            return View();
        }

        public IActionResult TeacherInbox()
        {
            return View();
        }

        public IActionResult AddChild()
        {
            return View();
        }

        public IActionResult ParentQuizzes()
        {
            return View();
        }

        public IActionResult ParentQuizResults()
        {
            return View();
        }

        public IActionResult ParentQuizResultDetail(string quizResultId)
        {
            ViewData["QuizResultId"] = quizResultId;
            return View();
        }

        public IActionResult TakeQuiz(string studentId, string assignmentId)
        {
            ViewData["StudentId"] = studentId;
            ViewData["AssignmentId"] = assignmentId;
            return View();
        }

        public IActionResult CreateQuiz()
        {
            return View();
        }

        public IActionResult PublishQuiz()
        {
            return View();
        }

        public IActionResult Login()
        {
            return View();
        }

        public IActionResult SignUp()
        {
            return View();
        }

        // ? ???? ????? ??????
        public IActionResult TeacheRegrister()
        {
            return View();
        }

        // ? ???? ????? ??? ?????
        public IActionResult ParentRegrister()
        {
            return View();
        }

        public IActionResult InstitutionRegrister()
        {
            return View();
        }

        public IActionResult VerifyOtp()
        {
            return View();
        }

        public IActionResult SetupStudents()
        {
            return View();
        }

        public IActionResult SetupWeeklySlots()
        {
            return View();
        }

        public IActionResult Verification()
        {
            return View();
        }

        public IActionResult NextVerification()
        {
            return View();
        }

        public IActionResult AfterVerification()
        {
            return View();
        }

        public IActionResult ForgotPassword()
        {
            return View();
        }

        public IActionResult NewPassword()
        {
            return View();
        }

        public IActionResult Profile()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel
            {
                RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
            });
        }
    }
}
