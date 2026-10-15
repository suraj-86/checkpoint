package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.DatasetActionResponse;
import com.checkpoint.admin.dto.DatasetImpactResponse;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.question.entity.QuestionDataset;
import com.checkpoint.question.repository.QuestionDatasetRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DatasetAdminService {

    private static final String QUESTION_IDS = "SELECT id FROM questions WHERE dataset_id = :datasetId";

    private final QuestionDatasetRepository datasetRepository;

    @PersistenceContext
    private EntityManager em;

    public DatasetAdminService(QuestionDatasetRepository datasetRepository) {
        this.datasetRepository = datasetRepository;
    }

    @Transactional(readOnly = true)
    public DatasetImpactResponse impact(UUID datasetId) {
        QuestionDataset dataset = findOrThrow(datasetId);
        return new DatasetImpactResponse(
                datasetId,
                dataset.getName(),
                count("SELECT COUNT(*) FROM questions WHERE dataset_id = :datasetId", datasetId),
                count("SELECT COUNT(*) FROM questions WHERE dataset_id = :datasetId AND is_active = true", datasetId),
                count("SELECT COUNT(*) FROM question_attempts WHERE question_id IN (" + QUESTION_IDS + ")", datasetId),
                count("SELECT COUNT(*) FROM session_questions WHERE question_id IN (" + QUESTION_IDS + ")", datasetId),
                count("SELECT COUNT(*) FROM user_question_progress WHERE question_id IN (" + QUESTION_IDS + ")", datasetId)
        );
    }

    @Transactional
    public DatasetActionResponse retire(UUID datasetId) {
        QuestionDataset dataset = findOrThrow(datasetId);
        int changed = setActive(datasetId, false);
        return new DatasetActionResponse(
                "Retired " + changed + " questions in \"" + dataset.getName() + "\".", changed);
    }

    @Transactional
    public DatasetActionResponse restore(UUID datasetId) {
        QuestionDataset dataset = findOrThrow(datasetId);
        int changed = setActive(datasetId, true);
        return new DatasetActionResponse(
                "Restored " + changed + " questions in \"" + dataset.getName() + "\".", changed);
    }

    @Transactional
    public DatasetActionResponse delete(UUID datasetId, String confirmName) {
        QuestionDataset dataset = findOrThrow(datasetId);
        if (confirmName == null || !confirmName.trim().equals(dataset.getName())) {
            throw new BadRequestException("Type the exact dataset name to confirm deletion.");
        }
        long questions = count("SELECT COUNT(*) FROM questions WHERE dataset_id = :datasetId", datasetId);

        exec("DELETE FROM question_attempts WHERE question_id IN (" + QUESTION_IDS + ")", datasetId);
        exec("DELETE FROM session_questions WHERE question_id IN (" + QUESTION_IDS + ")", datasetId);
        exec("DELETE FROM user_question_progress WHERE question_id IN (" + QUESTION_IDS + ")", datasetId);
        exec("DELETE FROM questions WHERE dataset_id = :datasetId", datasetId);
        exec("DELETE FROM question_datasets WHERE id = :datasetId", datasetId);

        return new DatasetActionResponse(
                "Deleted \"" + dataset.getName() + "\" and its " + questions + " questions.", questions);
    }

    private int setActive(UUID datasetId, boolean active) {
        return em.createNativeQuery(
                        "UPDATE questions SET is_active = :active WHERE dataset_id = :datasetId AND is_active <> :active")
                .setParameter("active", active)
                .setParameter("datasetId", datasetId)
                .executeUpdate();
    }

    private long count(String sql, UUID datasetId) {
        Object result = em.createNativeQuery(sql).setParameter("datasetId", datasetId).getSingleResult();
        return ((Number) result).longValue();
    }

    private void exec(String sql, UUID datasetId) {
        em.createNativeQuery(sql).setParameter("datasetId", datasetId).executeUpdate();
    }

    private QuestionDataset findOrThrow(UUID datasetId) {
        return datasetRepository.findById(datasetId)
                .orElseThrow(() -> new NotFoundException("Dataset not found: " + datasetId));
    }
}
