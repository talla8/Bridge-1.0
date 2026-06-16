using GP.Data;

namespace GP.Models.Repositories
{
    public class StudentRepository : IRepository<Student>
    {
        public AppDbContext db { get; }
        public StudentRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Student.Update(entity);
            db.SaveChanges();
        }

        public void Add(Student entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Student.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Student.Update(entity);
            db.SaveChanges();
        }

        public Student Find(int Id)
        {
            return db.Student.SingleOrDefault(x => x.StudentId == Id);
        }

        public void Update(int Id, Student entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Student.Update(entity);
            db.SaveChanges();
        }

        public List<Student> ViewAdmin()
        {
            return db.Student.Where(x => x.IsDelete == false).ToList();
        }

        public List<Student> ViewClient()
        {
            return db.Student.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
