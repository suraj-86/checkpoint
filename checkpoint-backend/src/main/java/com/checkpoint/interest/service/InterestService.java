package com.checkpoint.interest.service;

import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.interest.dto.InterestsResponse;
import com.checkpoint.interest.repository.UserInterestRepository;
import com.checkpoint.topic.repository.TopicRepository;
import com.checkpoint.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class InterestService {

    private static final int MAX_INTERESTS = 100;

    private final UserInterestRepository interestRepository;
    private final TopicRepository topicRepository;

    public InterestService(UserInterestRepository interestRepository, TopicRepository topicRepository) {
        this.interestRepository = interestRepository;
        this.topicRepository = topicRepository;
    }

    @Transactional(readOnly = true)
    public InterestsResponse get(User user) {
        return new InterestsResponse(List.copyOf(interestRepository.findTopicIds(user.getId())));
    }

    @Transactional
    public InterestsResponse replace(User user, List<UUID> requested) {
        Set<UUID> ids = new LinkedHashSet<>(requested);

        if (ids.contains(null)) {
            throw new BadRequestException("topicIds must not contain null values.");
        }
        if (ids.size() > MAX_INTERESTS) {
            throw new BadRequestException("Too many topics selected.");
        }
        if (!ids.isEmpty() && topicRepository.findAllById(ids).size() != ids.size()) {
            throw new BadRequestException("One or more selected topics do not exist.");
        }

        interestRepository.replaceAll(user.getId(), ids);
        return new InterestsResponse(List.copyOf(ids));
    }
}
