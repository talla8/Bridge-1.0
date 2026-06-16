using GP.Data;

namespace GP.Models.Repositories
{
    public class TeacherRepository : IRepository<Teacher>
    {
        public AppDbContext db { get; }
        public TeacherRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Teacher.Update(entity);
            db.SaveChanges();
        }

        public void Add(Teacher entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Teacher.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Teacher.Update(entity);
            db.SaveChanges();
        }

        public Teacher Find(int Id)
        {
            return db.Teacher.SingleOrDefault(x => x.TeacherId == Id);
        }

        public void Update(int Id, Teacher entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Teacher.Update(entity);
            db.SaveChanges();
        }

        public List<Teacher> ViewAdmin()
        {
            return db.Teacher.Where(x => x.IsDelete == false).ToList();
        }

        public List<Teacher> ViewClient()
        {
            return db.Teacher.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
